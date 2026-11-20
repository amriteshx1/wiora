import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, researchFindings, simulationRuns } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { respondJson } from "@/lib/openai-text";
import { deleteObject, headObject, presignDownload, presignUpload } from "@/lib/storage";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import {
  conversationTypes,
  correctionSchema,
  followUpAnswerSchema,
  followUpSchema,
  getPack,
  limitFollowUps,
  listRunStatus,
  type IntakeContext,
} from "../types";
import { safeFileName, uploadRejection } from "../uploads";
import {
  consumePreparationCredit,
  grantFreePreparationCredits,
  preparationChargeKey,
  reservePreparationCredit,
  restorePreparationCredit,
} from "./preparation-credits";
import { researchInputFingerprint, shouldSynthesizeOnly } from "./rerun-rules";

const editableStatuses = ["draft", "ready"] as const;

async function ownedPreparation(id: string, userId: string) {
  const [preparation] = await db
    .select()
    .from(preparations)
    .where(and(eq(preparations.id, id), eq(preparations.userId, userId)));

  if (!preparation) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Preparation not found",
    });
  }

  return preparation;
}

async function enqueuePreparation(
  preparationId: string,
  situationVersion: number,
  synthesizeOnly: boolean,
) {
  try {
    await inngest.send({
      name: "preparations/process",
      data: {
        preparationId,
        situationVersion,
        synthesizeOnly,
      },
    });
  } catch (error) {
    console.error("Preparation queue failed", error);
    await db
      .update(preparations)
      .set({
        status: "failed",
        processingStep: null,
        error: "The preparation could not be queued. Try again.",
        updatedAt: new Date(),
      })
      .where(and(
        eq(preparations.id, preparationId),
        eq(preparations.status, "processing"),
      ));
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The preparation could not be queued. Try again.",
    });
  }
}

async function readyDocumentIds(preparationId: string, userId: string) {
  const documents = await db
    .select({ id: preparationDocuments.id })
    .from(preparationDocuments)
    .where(
      and(
        eq(preparationDocuments.preparationId, preparationId),
        eq(preparationDocuments.userId, userId),
        eq(preparationDocuments.status, "ready"),
      ),
    );

  return documents.map((document) => document.id);
}

function asContext(value: unknown): IntakeContext {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntakeContext;
  }
  return {};
}

export const preparationsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        conversationType: z.enum(conversationTypes),
        title: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [created] = await db
        .insert(preparations)
        .values({
          userId: ctx.auth.user.id,
          conversationType: input.conversationType,
          title: input.title,
          status: "draft",
          context: {},
          situationVersion: 1,
        })
        .returning();

      return created;
    }),

  updateContext: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        context: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      if (!editableStatuses.includes(preparation.status as (typeof editableStatuses)[number])) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This preparation can no longer be edited",
        });
      }

      const pack = getPack(preparation.conversationType);
      if (!pack) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown conversation type" });
      }

      let parsed: IntakeContext;
      try {
        parsed = pack.schema.parse(input.context) as IntakeContext;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The preparation details are not valid",
        });
      }
      const existing = asContext(preparation.context);
      const nextContext = {
        ...parsed,
        followUps: parsed.followUps ?? existing.followUps,
        followUpsSubmitted: parsed.followUpsSubmitted ?? existing.followUpsSubmitted,
      };

      const [updated] = await db
        .update(preparations)
        .set({
          context: nextContext,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(preparations.id, preparation.id),
            eq(preparations.userId, ctx.auth.user.id),
          ),
        )
        .returning();

      return updated;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      const documents = await db
        .select()
        .from(preparationDocuments)
        .where(
          and(
            eq(preparationDocuments.preparationId, preparation.id),
            eq(preparationDocuments.userId, ctx.auth.user.id),
          ),
        )
        .orderBy(desc(preparationDocuments.createdAt));

      const findings = await db
        .select()
        .from(researchFindings)
        .where(eq(researchFindings.preparationId, preparation.id))
        .orderBy(desc(researchFindings.createdAt));

      return { ...preparation, documents, findings };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const where = and(
        eq(preparations.userId, ctx.auth.user.id),
        search
          ? or(
              ilike(preparations.title, `%${search}%`),
              sql`${preparations.context}::text ilike ${`%${search}%`}`,
            )
          : undefined,
      );

      const items = await db
        .select()
        .from(preparations)
        .where(where)
        .orderBy(desc(preparations.createdAt), desc(preparations.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(preparations)
        .where(where);

      const runRows = items.length === 0
        ? []
        : await db
            .select({
              preparationId: simulationRuns.preparationId,
              status: simulationRuns.status,
              createdAt: simulationRuns.createdAt,
              updatedAt: simulationRuns.updatedAt,
            })
            .from(simulationRuns)
            .where(and(
              eq(simulationRuns.userId, ctx.auth.user.id),
              inArray(simulationRuns.preparationId, items.map((item) => item.id)),
            ))
            .orderBy(desc(simulationRuns.createdAt));

      const runsByPreparation = new Map<string, Array<{ status: string; updatedAt: Date | null }>>();
      for (const row of runRows) {
        const statuses = runsByPreparation.get(row.preparationId) ?? [];
        statuses.push({ status: row.status, updatedAt: row.updatedAt });
        runsByPreparation.set(row.preparationId, statuses);
      }

      return {
        items: items.map((item) => ({
          ...item,
          latestRunStatus: listRunStatus(runsByPreparation.get(item.id) ?? []),
        })),
        total: total.count,
        totalPages: Math.ceil(total.count / pageSize),
      };
    }),

  createUpload: protectedProcedure
    .input(
      z.object({
        preparationId: z.string().min(1),
        fileName: z.string().min(1),
        contentType: z.string().min(1),
        byteSize: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.preparationId, ctx.auth.user.id);
      if (!editableStatuses.includes(preparation.status as (typeof editableStatuses)[number])) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Files cannot be added to this preparation",
        });
      }

      const rejection = uploadRejection(input.contentType, input.byteSize);
      if (rejection) {
        throw new TRPCError({ code: "BAD_REQUEST", message: rejection });
      }

      const [document] = await db
        .insert(preparationDocuments)
        .values({
          preparationId: preparation.id,
          userId: ctx.auth.user.id,
          objectKey: "pending",
          fileName: safeFileName(input.fileName),
          contentType: input.contentType,
          byteSize: input.byteSize,
          status: "pending",
          extractedText: "",
        })
        .returning();

      const key = `users/${ctx.auth.user.id}/preparations/${preparation.id}/${document.id}/${document.fileName}`;

      await db
        .update(preparationDocuments)
        .set({ objectKey: key, updatedAt: new Date() })
        .where(eq(preparationDocuments.id, document.id));

      try {
        const uploadUrl = await presignUpload({
          key,
          contentType: input.contentType,
          byteSize: input.byteSize,
        });

        return {
          documentId: document.id,
          uploadUrl,
        };
      } catch (error) {
        await db
          .delete(preparationDocuments)
          .where(eq(preparationDocuments.id, document.id));
        throw error;
      }
    }),

  confirmUpload: protectedProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [document] = await db
        .select()
        .from(preparationDocuments)
        .where(
          and(
            eq(preparationDocuments.id, input.documentId),
            eq(preparationDocuments.userId, ctx.auth.user.id),
          ),
        );

      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      let storedSize = 0;
      try {
        const head = await headObject(document.objectKey);
        storedSize = head.byteSize;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The file has not finished uploading",
        });
      }

      if (storedSize !== document.byteSize) {
        await deleteObject(document.objectKey).catch(() => undefined);
        await db
          .delete(preparationDocuments)
          .where(eq(preparationDocuments.id, document.id));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The uploaded file size did not match",
        });
      }

      const [updated] = await db
        .update(preparationDocuments)
        .set({
          status: "ready",
          extractedText: "",
          reading: null,
          updatedAt: new Date(),
        })
        .where(eq(preparationDocuments.id, document.id))
        .returning();

      return updated;
    }),

  removeDocument: protectedProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [document] = await db
        .select()
        .from(preparationDocuments)
        .where(
          and(
            eq(preparationDocuments.id, input.documentId),
            eq(preparationDocuments.userId, ctx.auth.user.id),
          ),
        );

      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const preparation = await ownedPreparation(document.preparationId, ctx.auth.user.id);
      if (!editableStatuses.includes(preparation.status as (typeof editableStatuses)[number])) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Files cannot be removed from this preparation",
        });
      }

      await deleteObject(document.objectKey).catch(() => undefined);
      await db
        .delete(preparationDocuments)
        .where(eq(preparationDocuments.id, document.id));

      const context = asContext(preparation.context);
      const documents = Array.isArray(context.documents)
        ? context.documents.filter((item) => item.id !== document.id)
        : [];

      await db
        .update(preparations)
        .set({
          context: { ...context, documents },
          updatedAt: new Date(),
        })
        .where(eq(preparations.id, preparation.id));

      return { id: document.id };
    }),

  getDocumentUrl: protectedProcedure
    .input(z.object({ documentId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [document] = await db
        .select()
        .from(preparationDocuments)
        .where(
          and(
            eq(preparationDocuments.id, input.documentId),
            eq(preparationDocuments.userId, ctx.auth.user.id),
          ),
        );

      if (!document) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      }

      const url = await presignDownload(document.objectKey);
      return { url };
    }),

  requestFollowUps: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      if (preparation.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Follow-up questions are only available while the preparation is a draft",
        });
      }

      const pack = getPack(preparation.conversationType);
      if (!pack) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown conversation type" });
      }

      const context = asContext(preparation.context);
      if (context.followUpsSubmitted === true) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Follow-up questions were already submitted",
        });
      }

      const readyIds = await readyDocumentIds(preparation.id, ctx.auth.user.id);
      if (!pack.hasMinimum(context, readyIds)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add the required context before continuing",
        });
      }

      const fieldNames = pack.fields.map((field) => field.name).join(", ");
      const result = await respondJson({
        schema: followUpSchema,
        name: "follow_ups",
        input: [
          "You are collecting context for one real upcoming conversation.",
          "Ask at most 3 follow-up questions, and only when the answer would change how the simulation is built.",
          "If nothing material is missing, return an empty questions array.",
          `Allowed field names: ${fieldNames}.`,
          "The JSON context already contains the user's submitted answers.",
          "Do not ask about a field that already has a non-empty value.",
          "Do not rephrase a submitted job description, resume, company, role, or similar field as a new question.",
          "Do not ask for a difficulty, a personality, or a question list.",
          `Conversation type: ${pack.label}`,
          `Context: ${JSON.stringify(context)}`,
        ].join("\n"),
      });

      return {
        questions: limitFollowUps(result.questions),
      };
    }),

  submitFollowUps: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        answers: z.array(followUpAnswerSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      if (preparation.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This preparation can no longer accept follow-ups",
        });
      }

      const pack = getPack(preparation.conversationType);
      if (!pack) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown conversation type" });
      }

      const context = asContext(preparation.context);
      const readyIds = await readyDocumentIds(preparation.id, ctx.auth.user.id);
      if (!pack.hasMinimum(context, readyIds)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add the required context before continuing",
        });
      }

      const nextContext = {
        ...context,
        followUps: input.answers,
        followUpsSubmitted: true,
      };

      await grantFreePreparationCredits(ctx.auth.user.id);
      const reserved = await reservePreparationCredit(
        ctx.auth.user.id,
        preparation.id,
        preparationChargeKey(preparation.id, preparation.situationVersion),
      );
      if (reserved === "empty") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have used your preparation credits. Buy a plan to prepare another conversation.",
        });
      }

      const [updated] = await db
        .update(preparations)
        .set({
          context: nextContext,
          status: "processing",
          processingStep: "extracting",
          error: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(preparations.id, preparation.id),
            eq(preparations.userId, ctx.auth.user.id),
          ),
        )
        .returning();

      try {
        await enqueuePreparation(updated.id, updated.situationVersion, false);
      } catch (error) {
        if (reserved === "reserved") {
          await restorePreparationCredit(updated.id);
        }
        throw error;
      }
      await consumePreparationCredit(updated.id);

      return updated;
    }),

  saveCorrections: protectedProcedure
    .input(z.object({
      id: z.string().min(1),
      corrections: correctionSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      if (preparation.status !== "ready") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Corrections can be saved when the brief is ready",
        });
      }

      const pack = getPack(preparation.conversationType);
      if (!pack) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown conversation type" });
      }

      const context = asContext(preparation.context);
      const allowed = new Set(pack.fields.map((field) => field.name));
      const edited = { ...context };
      for (const edit of input.corrections.fieldEdits ?? []) {
        if (allowed.has(edit.field)) {
          edited[edit.field] = edit.value;
        }
      }

      const parsed = pack.schema.parse(edited) as IntakeContext;
      const previous = asContext(context.corrections);
      const previousFacts = Array.isArray(previous.addedFacts)
        ? previous.addedFacts.filter((fact): fact is string => typeof fact === "string")
        : [];
      const nextContext = {
        ...parsed,
        documents: context.documents,
        followUps: context.followUps,
        followUpsSubmitted: true,
        corrections: {
          removedFindingIds: input.corrections.removedFindingIds ?? [],
          addedFacts: [...previousFacts, ...(input.corrections.addedFacts ?? [])],
          fieldEdits: input.corrections.fieldEdits ?? [],
        },
      };

      const removed = input.corrections.removedFindingIds ?? [];
      if (removed.length > 0) {
        await db
          .delete(researchFindings)
          .where(and(
            eq(researchFindings.preparationId, preparation.id),
            inArray(researchFindings.id, removed),
          ));
      }

      const documentIds = await readyDocumentIds(preparation.id, ctx.auth.user.id);
      const fingerprint = researchInputFingerprint(nextContext, documentIds);
      const synthesizeOnly = shouldSynthesizeOnly(preparation.researchInputHash, fingerprint);

      await grantFreePreparationCredits(ctx.auth.user.id);
      const reserved = await reservePreparationCredit(
        ctx.auth.user.id,
        preparation.id,
        preparationChargeKey(preparation.id, preparation.situationVersion),
      );
      if (reserved === "empty") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have used your preparation credits. Buy a plan to prepare another conversation.",
        });
      }

      const [updated] = await db
        .update(preparations)
        .set({
          context: nextContext,
          status: "processing",
          processingStep: synthesizeOnly ? "synthesizing" : "extracting",
          error: null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(preparations.id, preparation.id),
          eq(preparations.userId, ctx.auth.user.id),
        ))
        .returning();

      try {
        await enqueuePreparation(updated.id, updated.situationVersion, synthesizeOnly);
      } catch (error) {
        if (reserved === "reserved") {
          await restorePreparationCredit(updated.id);
        }
        throw error;
      }
      await consumePreparationCredit(updated.id);

      return updated;
    }),

  rerun: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const preparation = await ownedPreparation(input.id, ctx.auth.user.id);
      if (preparation.status !== "ready" && preparation.status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This preparation cannot be prepared again yet",
        });
      }

      await grantFreePreparationCredits(ctx.auth.user.id);
      const reserved = await reservePreparationCredit(
        ctx.auth.user.id,
        preparation.id,
        preparationChargeKey(preparation.id, preparation.situationVersion),
      );
      if (reserved === "empty") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have used your preparation credits. Buy a plan to prepare another conversation.",
        });
      }

      const context = asContext(preparation.context);
      const documentIds = await readyDocumentIds(preparation.id, ctx.auth.user.id);
      const fingerprint = researchInputFingerprint(context, documentIds);
      const synthesizeOnly = shouldSynthesizeOnly(preparation.researchInputHash, fingerprint);

      const [updated] = await db
        .update(preparations)
        .set({
          status: "processing",
          processingStep: synthesizeOnly ? "synthesizing" : "extracting",
          error: null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(preparations.id, preparation.id),
          eq(preparations.userId, ctx.auth.user.id),
        ))
        .returning();

      try {
        await enqueuePreparation(updated.id, updated.situationVersion, synthesizeOnly);
      } catch (error) {
        if (reserved === "reserved") {
          await restorePreparationCredit(updated.id);
        }
        throw error;
      }
      await consumePreparationCredit(updated.id);

      return updated;
    }),
});
