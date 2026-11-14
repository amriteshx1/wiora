import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparations, sessionTurns, simulationRuns, user } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";
import { streamVideo } from "@/lib/stream-video";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { markRunActive } from "@/inngest/run-hard-stop";
import { startWorker } from "./worker-client";
import { openAuthorizedRun } from "./authorize-run";
import { creditBalance, reserveCredit, restoreCredit } from "./credits";
import { INTERVIEW_MINUTES } from "./credit-rules";
import { createDrill, createNextPractice } from "./drill";

async function ownedRun(runId: string, userId: string) {
  const [run] = await db
    .select()
    .from(simulationRuns)
    .where(and(eq(simulationRuns.id, runId), eq(simulationRuns.userId, userId)));
  if (!run) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  }
  return run;
}

function needsCredits() {
  return { needsCredits: true as const, runId: null, url: "/upgrade" };
}

async function authorizeRun(runId: string, userId: string, createdNow: boolean) {
  const reserved = await reserveCredit(userId, runId);
  if (reserved === "empty") {
    if (createdNow) {
      await db.delete(simulationRuns).where(and(eq(simulationRuns.id, runId), eq(simulationRuns.status, "unpaid")));
    }
    return needsCredits();
  }
  try {
    await openAuthorizedRun(runId);
  } catch (error) {
    await restoreCredit(runId);
    await db
      .update(simulationRuns)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(simulationRuns.id, runId));
    const message = error instanceof Error ? error.message : "The interview could not be started";
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
  }
  return { needsCredits: false as const, runId, url: `/call/${runId}` };
}

function canJoin(run: { status: string; hardEndAt: Date | null; startedAt: Date | null }): boolean {
  if (run.status !== "paid" && run.status !== "active") return false;
  if (run.status === "paid" && run.startedAt == null) return true;
  if (run.hardEndAt && run.hardEndAt.getTime() <= Date.now()) return false;
  return true;
}

async function assertNoOtherLiveSession(userId: string) {
  const [active] = await db
    .select({ id: simulationRuns.id })
    .from(simulationRuns)
    .where(and(
      eq(simulationRuns.userId, userId),
      eq(simulationRuns.status, "active"),
    ));
  if (active) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You already have a live session" });
  }
}

export const runsRouter = createTRPCRouter({
  startInterview: protectedProcedure
    .input(z.object({ preparationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [preparation] = await db
        .select()
        .from(preparations)
        .where(and(
          eq(preparations.id, input.preparationId),
          eq(preparations.userId, ctx.auth.user.id),
        ));
      if (!preparation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preparation not found" });
      }
      if (preparation.status !== "ready") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This preparation is not ready for an interview" });
      }

      const [open] = await db
        .select()
        .from(simulationRuns)
        .where(and(
          eq(simulationRuns.preparationId, preparation.id),
          eq(simulationRuns.userId, ctx.auth.user.id),
          inArray(simulationRuns.status, ["unpaid", "paid", "active"]),
        ))
        .orderBy(desc(simulationRuns.createdAt))
        .limit(1);

      if (open?.status === "paid" || open?.status === "active") {
        return { needsCredits: false as const, runId: open.id, url: `/call/${open.id}` };
      }

      await assertNoOtherLiveSession(ctx.auth.user.id);

      if (open?.status === "unpaid") {
        return authorizeRun(open.id, ctx.auth.user.id, false);
      }

      let runId = "";
      try {
        const [run] = await db
          .insert(simulationRuns)
          .values({
            preparationId: preparation.id,
            userId: ctx.auth.user.id,
            kind: "full",
            sourceWeaknessId: null,
            sourceRunId: null,
            drillStrategy: null,
            situationVersion: preparation.situationVersion,
            durationMinutes: INTERVIEW_MINUTES,
            status: "unpaid",
          })
          .returning();
        runId = run.id;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        const cause = typeof error === "object" && error && "cause" in error ? error.cause : null;
        const causeCode = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
        const causeMessage = cause instanceof Error ? cause.message : "";
        const duplicate = code === "23505"
          || causeCode === "23505"
          || message.includes("simulation_runs_one_open_idx")
          || causeMessage.includes("simulation_runs_one_open_idx");
        if (!duplicate) throw error;
        const [existing] = await db
          .select()
          .from(simulationRuns)
          .where(and(
            eq(simulationRuns.preparationId, preparation.id),
            inArray(simulationRuns.status, ["unpaid", "paid", "active"]),
          ))
          .limit(1);
        if (!existing) throw error;
        if (existing.status === "paid" || existing.status === "active") {
          return { needsCredits: false as const, runId: existing.id, url: `/call/${existing.id}` };
        }
        return authorizeRun(existing.id, ctx.auth.user.id, false);
      }

      return authorizeRun(runId, ctx.auth.user.id, true);
    }),

  startDrill: protectedProcedure
    .input(z.object({ runId: z.string().min(1), weaknessId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertNoOtherLiveSession(ctx.auth.user.id);
      if (await creditBalance(ctx.auth.user.id) < 1) return needsCredits();
      try {
        const runId = await createDrill({ ...input, userId: ctx.auth.user.id });
        return authorizeRun(runId, ctx.auth.user.id, true);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "The practice session could not be created",
        });
      }
    }),

  startNextPractice: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertNoOtherLiveSession(ctx.auth.user.id);
      if (await creditBalance(ctx.auth.user.id) < 1) return needsCredits();
      try {
        const runId = await createNextPractice({ runId: input.runId, userId: ctx.auth.user.id });
        return authorizeRun(runId, ctx.auth.user.id, true);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "The next practice could not be created",
        });
      }
    }),

  getTranscript: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const run = await ownedRun(input.runId, ctx.auth.user.id);
      const [owner] = await db.select({ name: user.name }).from(user).where(eq(user.id, run.userId));
      const turns = await db
        .select()
        .from(sessionTurns)
        .where(eq(sessionTurns.runId, run.id))
        .orderBy(asc(sessionTurns.startedAt));
      return turns.map((turn) => ({
        text: turn.text,
        startTs: turn.startedAt.getTime(),
        name: turn.speaker === "user" ? (owner?.name || "You") : (run.counterpartName || "Counterpart"),
      }));
    }),

  getOne: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .query(async ({ ctx, input }) => ownedRun(input.runId, ctx.auth.user.id)),

  getLatest: protectedProcedure
    .input(z.object({ preparationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [preparation] = await db
        .select({ id: preparations.id })
        .from(preparations)
        .where(and(
          eq(preparations.id, input.preparationId),
          eq(preparations.userId, ctx.auth.user.id),
        ));
      if (!preparation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Preparation not found" });
      }
      const [run] = await db
        .select()
        .from(simulationRuns)
        .where(eq(simulationRuns.preparationId, preparation.id))
        .orderBy(desc(simulationRuns.createdAt))
        .limit(1);
      return run ?? null;
    }),

  generateToken: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const run = await ownedRun(input.runId, ctx.auth.user.id);
      if (!canJoin(run)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This session cannot be joined" });
      }

      if (process.env.NODE_ENV !== "production") {
        if (run.status === "paid") {
          await markRunActive(run);
        } else if (run.status === "active") {
          await startWorker(run.id);
        }
      }

      await streamVideo.upsertUsers([
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          role: "admin",
          image: ctx.auth.user.image ?? generateAvatarUri({
            seed: ctx.auth.user.name,
            variant: "initials",
          }),
        },
      ]);

      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const issuedAt = Math.floor(Date.now() / 1000) - 60;
      return streamVideo.generateUserToken({
        user_id: ctx.auth.user.id,
        exp: expirationTime,
        validity_in_seconds: issuedAt,
      });
    }),

  generateChatToken: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const run = await ownedRun(input.runId, ctx.auth.user.id);
      if (!canJoin(run) && run.status !== "completed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This session cannot be joined" });
      }
      const token = streamChat.createToken(ctx.auth.user.id);
      await streamChat.upsertUser({
        id: ctx.auth.user.id,
        role: "admin",
      });
      return token;
    }),
});
