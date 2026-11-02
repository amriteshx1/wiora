import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, researchFindings, sessionTurns, simulationRuns } from "@/db/schema";
import { respondJson } from "@/lib/openai-responses";

const drillSchema = z.object({
  skill: z.string(),
  whyTheLastAnswerFailed: z.string(),
  whatAStrongAnswerMustShow: z.string(),
  differentScenario: z.string(),
  questioningPath: z.string(),
  bannedQuote: z.string(),
});

type Weakness = {
  id: string;
  whatWentWrong: string;
  whyItWasProblematic: string;
  whatWasExpected: string;
  whatAStrongAnswerWouldHaveDemonstrated: string;
  missingEvidence: string;
  quote: string;
  areaId: string;
  startTs?: number;
};

type ReportShape = {
  weaknesses?: Weakness[];
  nextPractice?: { focus: string; why: string; suggestedMinutes: 30 | 45 | 60 };
};

export async function createDrill(input: { runId: string; weaknessId: string; userId: string }): Promise<string> {
  const [run] = await db
    .select()
    .from(simulationRuns)
    .where(and(
      eq(simulationRuns.id, input.runId),
      eq(simulationRuns.userId, input.userId),
      eq(simulationRuns.status, "completed"),
    ));
  if (!run) {
    throw new Error("Completed session not found");
  }
  const report = run.report as ReportShape | null;
  const weakness = report?.weaknesses?.find((item) => item.id === input.weaknessId);
  if (!weakness) {
    throw new Error("That weakness is not in the report");
  }

  const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
  if (!preparation) throw new Error("Preparation not found");

  const turns = await db
    .select()
    .from(sessionTurns)
    .where(eq(sessionTurns.runId, run.id))
    .orderBy(asc(sessionTurns.startedAt));
  const nearby = weakness.startTs == null
    ? turns.slice(0, 8)
    : turns.filter((turn) => Math.abs(turn.startedAt.getTime() - weakness.startTs!) < 120000).slice(0, 12);
  const documents = await db
    .select({ fileName: preparationDocuments.fileName, reading: preparationDocuments.reading })
    .from(preparationDocuments)
    .where(eq(preparationDocuments.preparationId, preparation.id));
  const findings = await db
    .select({ statement: researchFindings.statement, category: researchFindings.category })
    .from(researchFindings)
    .where(eq(researchFindings.preparationId, preparation.id));

  const strategy = await respondJson({
    schema: drillSchema,
    name: "drill_strategy",
    input: [
      "Design one paid practice session that revisits a weakness from a completed conversation.",
      "Keep the original company, role, counterpart, and facts.",
      "Change the angle. Do not ask the previous quote again.",
      "bannedQuote must be the weakness quote.",
      `Weakness:\n${JSON.stringify(weakness)}`,
      `Nearby transcript:\n${JSON.stringify(nearby)}`,
      `Situation:\n${JSON.stringify(preparation.situationModel)}`,
      `Readings:\n${JSON.stringify(documents)}`,
      `Findings:\n${JSON.stringify(findings)}`,
    ].join("\n\n"),
  });
  strategy.bannedQuote = weakness.quote;

  const situation = preparation.situationModel as { counterpartName?: string } | null;
  const [created] = await db
    .insert(simulationRuns)
    .values({
      preparationId: preparation.id,
      userId: input.userId,
      kind: "replay",
      sourceWeaknessId: weakness.id,
      sourceRunId: run.id,
      drillStrategy: strategy,
      situationVersion: preparation.situationVersion,
      durationMinutes: run.durationMinutes,
      status: "unpaid",
      counterpartName: situation?.counterpartName || run.counterpartName,
    })
    .returning({ id: simulationRuns.id });
  return created.id;
}

export async function createNextPractice(input: { runId: string; userId: string }): Promise<string> {
  const [run] = await db
    .select()
    .from(simulationRuns)
    .where(and(
      eq(simulationRuns.id, input.runId),
      eq(simulationRuns.userId, input.userId),
      eq(simulationRuns.status, "completed"),
    ));
  if (!run) throw new Error("Completed session not found");
  const report = run.report as ReportShape | null;
  const minutes = report?.nextPractice?.suggestedMinutes;
  if (minutes !== 30 && minutes !== 45 && minutes !== 60) {
    throw new Error("The report has no next practice length");
  }
  const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
  if (!preparation) throw new Error("Preparation not found");
  const situation = preparation.situationModel as { counterpartName?: string } | null;
  const [created] = await db
    .insert(simulationRuns)
    .values({
      preparationId: preparation.id,
      userId: input.userId,
      kind: "next_practice",
      sourceRunId: run.id,
      drillStrategy: null,
      situationVersion: preparation.situationVersion,
      durationMinutes: minutes,
      status: "unpaid",
      counterpartName: situation?.counterpartName || run.counterpartName,
    })
    .returning({ id: simulationRuns.id });
  return created.id;
}
