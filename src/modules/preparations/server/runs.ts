import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparations, sessionTurns, simulationRuns, user } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { polarClient } from "@/lib/polar";
import { streamChat } from "@/lib/stream-chat";
import { streamVideo } from "@/lib/stream-video";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { markRunActive } from "@/inngest/run-hard-stop";
import { startWorker } from "./worker-client";
import { applyOrderPaid } from "./orders";
import { localProductId, localSessionsAreFree, productForDuration } from "./products";
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

async function checkoutUrl(run: { id: string; preparationId: string; durationMinutes: number }, userId: string) {
  if (run.durationMinutes !== 30 && run.durationMinutes !== 45 && run.durationMinutes !== 60) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This session has no price" });
  }
  if (localSessionsAreFree()) {
    await applyOrderPaid({
      id: `local-${run.id}`,
      productId: localProductId(run.durationMinutes),
      checkoutId: null,
      metadata: { runId: run.id },
    });
    const [updated] = await db
      .select({ status: simulationRuns.status })
      .from(simulationRuns)
      .where(eq(simulationRuns.id, run.id));
    if (updated?.status !== "paid") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The local session could not be opened" });
    }
    return `/call/${run.id}`;
  }

  const productId = productForDuration(run.durationMinutes);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkout = await polarClient.checkouts.create({
    products: [productId],
    customerExternalId: userId,
    metadata: { runId: run.id },
    successUrl: `${origin}/preparations/${run.preparationId}?checkout_id={CHECKOUT_ID}`,
  });
  return checkout.url;
}

function canJoin(run: { status: string; hardEndAt: Date | null; startedAt: Date | null }): boolean {
  if (run.status !== "paid" && run.status !== "active") return false;
  if (run.status === "paid" && run.startedAt == null) return true;
  if (run.hardEndAt && run.hardEndAt.getTime() <= Date.now()) return false;
  return true;
}

export const runsRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(z.object({
      preparationId: z.string().min(1),
      durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
    }))
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
        throw new TRPCError({ code: "BAD_REQUEST", message: "This preparation is not ready for a session" });
      }

      const [active] = await db
        .select({ id: simulationRuns.id })
        .from(simulationRuns)
        .where(and(
          eq(simulationRuns.userId, ctx.auth.user.id),
          eq(simulationRuns.status, "active"),
        ));
      if (active) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You already have a live session" });
      }

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
          durationMinutes: input.durationMinutes,
          status: "unpaid",
        })
        .returning();

      try {
        const url = await checkoutUrl(run, ctx.auth.user.id);
        return { runId: run.id, url };
      } catch (error) {
        await db.delete(simulationRuns).where(eq(simulationRuns.id, run.id));
        const message = error instanceof Error ? error.message : "Checkout could not be opened";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  createCheckoutForExisting: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const run = await ownedRun(input.runId, ctx.auth.user.id);
      if (run.status !== "unpaid" || (run.kind !== "replay" && run.kind !== "next_practice")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This session is not waiting for payment" });
      }
      const url = await checkoutUrl(run, ctx.auth.user.id);
      return { runId: run.id, url, durationMinutes: run.durationMinutes };
    }),

  createDrill: protectedProcedure
    .input(z.object({ runId: z.string().min(1), weaknessId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const runId = await createDrill({ ...input, userId: ctx.auth.user.id });
        return { runId };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "The practice session could not be created",
        });
      }
    }),

  createNextPractice: protectedProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const runId = await createNextPractice({ runId: input.runId, userId: ctx.auth.user.id });
        return { runId };
      } catch (error) {
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
