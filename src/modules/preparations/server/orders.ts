import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { preparations, researchFindings, simulationRuns } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";

import { renderBrief, type BriefSituation, type DrillStrategy } from "./brief";
import { durationForProduct } from "./products";

type PaidOrder = {
  id: string;
  productId: string;
  checkoutId: string | null;
  metadata: Record<string, string | number | boolean> | null;
};

function asSituation(value: unknown): BriefSituation | null {
  if (!value || typeof value !== "object") return null;
  const model = value as BriefSituation;
  if (!model.conversationStyle || !Array.isArray(model.areas) || !Array.isArray(model.knownFacts)) {
    return null;
  }
  return {
    ...model,
    patternWeights: Array.isArray(model.patternWeights) ? model.patternWeights : [],
    unknowns: Array.isArray(model.unknowns) ? model.unknowns : [],
    counterpartName: model.counterpartName || "Counterpart",
    counterpartObjective: model.counterpartObjective || "",
  };
}

async function failRun(runId: string, message: string) {
  await db
    .update(simulationRuns)
    .set({
      status: "failed",
      sessionState: { error: message.slice(0, 280) },
      updatedAt: new Date(),
    })
    .where(eq(simulationRuns.id, runId));
}

export async function applyOrderPaid(order: PaidOrder): Promise<void> {
  const runId = typeof order.metadata?.runId === "string" ? order.metadata.runId : "";
  if (!runId) {
    console.error("Paid order has no run");
    return;
  }

  const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId));
  if (!run) {
    console.error(`Paid order did not match a session ${runId}`);
    return;
  }

  const minutes = durationForProduct(order.productId);
  if (minutes !== run.durationMinutes) {
    console.error(`Paid product ${order.productId} does not match the ${run.durationMinutes}-minute session ${run.id}`);
    return;
  }

  if (run.polarOrderId === order.id) {
    return;
  }

  const [preparation] = await db
    .select()
    .from(preparations)
    .where(eq(preparations.id, run.preparationId));
  if (!preparation) {
    await failRun(run.id, "The preparation for this session is missing");
    return;
  }

  const situation = asSituation(preparation.situationModel);
  if (!situation) {
    await failRun(run.id, "The situation brief is missing");
    return;
  }

  const findings = await db
    .select({
      statement: researchFindings.statement,
      category: researchFindings.category,
    })
    .from(researchFindings)
    .where(eq(researchFindings.preparationId, preparation.id));

  let nextPracticeFocus: string | null = null;
  if (run.kind === "next_practice" && run.sourceRunId) {
    const [source] = await db.select({ report: simulationRuns.report }).from(simulationRuns).where(eq(simulationRuns.id, run.sourceRunId));
    const focus = (source?.report as { nextPractice?: { focus?: string } } | null)?.nextPractice?.focus;
    nextPracticeFocus = typeof focus === "string" ? focus : null;
  }

  let briefText = "";
  try {
    briefText = renderBrief({
      situationModel: situation,
      findings,
      durationMinutes: run.durationMinutes,
      minutesRemaining: run.durationMinutes,
      sessionState: null,
      drillStrategy: (run.drillStrategy as DrillStrategy | null) ?? null,
      nextPracticeFocus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief could not be rendered";
    await failRun(run.id, message);
    return;
  }

  const [paid] = await db
    .update(simulationRuns)
    .set({
      polarOrderId: order.id,
      polarCheckoutId: order.checkoutId,
      paidAt: new Date(),
      status: "paid",
      counterpartName: situation.counterpartName,
      briefText,
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "unpaid")))
    .returning();

  if (!paid) {
    return;
  }

  try {
    const call = streamVideo.video.call("default", run.id);
    await call.create({
      data: {
        created_by_id: run.userId,
        custom: {
          runId: run.id,
          preparationId: run.preparationId,
        },
        settings_override: {
          transcription: {
            language: "en",
            mode: "auto-on",
            closed_caption_mode: "auto-on",
          },
          recording: {
            mode: "auto-on",
            quality: "1080p",
          },
        },
      },
    });
    await streamVideo.upsertUsers([
      {
        id: `cp_${run.id}`,
        name: situation.counterpartName,
        role: "user",
        image: generateAvatarUri({
          seed: situation.counterpartName,
          variant: "botttsNeutral",
        }),
      },
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The call could not be created";
    await failRun(run.id, message);
  }
}

export async function applyOrderRefunded(order: PaidOrder): Promise<void> {
  const runId = typeof order.metadata?.runId === "string" ? order.metadata.runId : "";
  if (!runId) return;

  const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId));
  if (!run || run.status !== "paid") return;

  await db
    .update(simulationRuns)
    .set({
      status: "failed",
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "paid")));
}
