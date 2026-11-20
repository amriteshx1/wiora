import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { preparations, researchFindings, simulationRuns } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";

import { renderBrief, type BriefSituation, type DrillStrategy } from "./brief";

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

export async function openAuthorizedRun(runId: string): Promise<void> {
  const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId));
  if (!run) throw new Error("Session not found");
  if (run.status === "paid" || run.status === "active") return;
  if (run.status !== "unpaid") throw new Error("This session cannot be started");

  const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
  if (!preparation) {
    await failRun(run.id, "The preparation for this session is missing");
    throw new Error("The preparation for this session is missing");
  }

  const situation = asSituation(preparation.situationModel);
  if (!situation) {
    await failRun(run.id, "The situation brief is missing");
    throw new Error("The situation brief is missing");
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
    const [source] = await db
      .select({ report: simulationRuns.report })
      .from(simulationRuns)
      .where(eq(simulationRuns.id, run.sourceRunId));
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
    throw new Error(message);
  }

  const [opened] = await db
    .update(simulationRuns)
    .set({
      paidAt: new Date(),
      status: "paid",
      counterpartName: situation.counterpartName,
      briefText,
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "unpaid")))
    .returning();

  if (!opened) return;

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
    throw new Error(message);
  }
}
