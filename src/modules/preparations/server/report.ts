import JSONL from "jsonl-parse-stringify";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, sessionTurns, simulationRuns, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { resend } from "@/lib/resend";
import { respondJson } from "@/lib/openai-responses";
import { logUsage } from "@/lib/usage-log";
import { StreamTranscriptItem } from "@/modules/meetings/types";

import { getPack } from "../types";
import { compactDocumentReadings, compactSituation } from "./compact-context";
import { sessionOriginMs, toElapsedMs } from "./elapsed";
import { attachQuotes, type QuoteCheckedReport, type TranscriptLine } from "./quotes";

const reportSchema = z.object({
  objectiveJudgment: z.string(),
  preparedness: z.string(),
  dimensions: z.array(z.object({
    name: z.string(),
    assessment: z.string(),
    quote: z.string().nullable(),
  })),
  strengths: z.array(z.object({
    statement: z.string(),
    quote: z.string(),
  })),
  demonstrated: z.array(z.string()),
  uncertain: z.array(z.string()),
  weaknesses: z.array(z.object({
    id: z.string(),
    whatWentWrong: z.string(),
    whyItWasProblematic: z.string(),
    whatWasExpected: z.string(),
    whatAStrongAnswerWouldHaveDemonstrated: z.string(),
    missingEvidence: z.string(),
    quote: z.string(),
    areaId: z.string(),
  })),
  moments: z.array(z.object({
    id: z.string(),
    kind: z.enum(["strength", "weakness", "missed", "challenge"]),
    statement: z.string(),
    quote: z.string(),
  })),
  counterpartConcerns: z.array(z.string()),
  nextPractice: z.object({
    focus: z.string(),
    why: z.string(),
    suggestedMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  }),
});

function speakerName(speakerId: string, runUserId: string, runId: string, userName: string, counterpartName: string) {
  if (speakerId === runUserId) return userName || "You";
  if (speakerId === `cp_${runId}`) return counterpartName || "Counterpart";
  return "Unknown";
}

type SpokenLine = TranscriptLine & { speaker: string };

async function linesFromStream(run: { id: string; userId: string; transcriptUrl: string; counterpartName: string | null }): Promise<SpokenLine[]> {
  const response = await fetch(run.transcriptUrl);
  const text = await response.text();
  const transcript = JSONL.parse<StreamTranscriptItem>(text);
  const [owner] = await db.select({ name: user.name }).from(user).where(eq(user.id, run.userId));
  return transcript.map((item) => ({
    text: item.text,
    startTs: item.start_ts,
    speaker: speakerName(item.speaker_id, run.userId, run.id, owner?.name || "You", run.counterpartName || "Counterpart"),
  }));
}

async function linesFromTurns(run: { id: string; startedAt: Date | null }): Promise<SpokenLine[]> {
  const turns = await db
    .select()
    .from(sessionTurns)
    .where(eq(sessionTurns.runId, run.id))
    .orderBy(asc(sessionTurns.startedAt));
  const origin = sessionOriginMs(run.startedAt, turns[0]?.startedAt);
  return turns.map((turn) => ({
    text: turn.text,
    startTs: toElapsedMs(turn.startedAt, origin),
    speaker: turn.speaker,
  }));
}

export async function buildReport(runId: string): Promise<void> {
  const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId));
  if (!run || run.report) return;

  const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
  if (!preparation) return;

  let transcriptSource: "stream" | "session_turns" = "stream";
  let lines: TranscriptLine[] = [];
  if (run.transcriptUrl) {
    lines = await linesFromStream({
      id: run.id,
      userId: run.userId,
      transcriptUrl: run.transcriptUrl,
      counterpartName: run.counterpartName,
    });
  } else {
    transcriptSource = "session_turns";
    lines = await linesFromTurns(run);
  }
  if (lines.length === 0) return;

  const documents = await db
    .select({ fileName: preparationDocuments.fileName, reading: preparationDocuments.reading })
    .from(preparationDocuments)
    .where(eq(preparationDocuments.preparationId, preparation.id));
  const pack = getPack(preparation.conversationType);
  const situation = preparation.situationModel as { evaluationDimensions?: { name: string; whatGoodLooksLike: string }[] } | null;
  const dimensions = preparation.conversationType === "custom"
    ? (situation?.evaluationDimensions ?? []).map((item) => item.name)
    : (pack?.evaluationDimensions ?? []);

  const generated = await respondJson({
    schema: reportSchema,
    name: "preparation_report",
    input: [
      "Write one preparation report for one completed practice conversation.",
      "Do not give a numeric score.",
      "Every weakness must explain what went wrong, why that was a problem, what was expected, what a strong answer would have demonstrated, and what evidence was missing. missingEvidence is an empty string when nothing specific was missing.",
      "Quotes must be copied from the transcript. Do not paraphrase a quote.",
      "Each moment.statement is two to four sentences: what happened in that beat, why it mattered in the conversation, and what it revealed. Do not write one-line moments.",
      `Evaluation dimensions: ${JSON.stringify(dimensions)}`,
      `Transcript:\n${JSON.stringify(lines)}`,
      `Situation:\n${JSON.stringify(compactSituation(preparation.situationModel))}`,
      `Document readings:\n${JSON.stringify(compactDocumentReadings(documents))}`,
      `Final session state:\n${JSON.stringify(run.sessionState)}`,
    ].join("\n\n"),
  });
  logUsage({ kind: "report_generation", runId: run.id, preparationId: preparation.id, ok: true });

  const report: QuoteCheckedReport = attachQuotes({
    ...generated,
    transcriptSource,
  }, lines);

  const [saved] = await db
    .update(simulationRuns)
    .set({
      report,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, run.id), isNull(simulationRuns.report)))
    .returning({ id: simulationRuns.id });
  if (!saved) return;

  const [owner] = await db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, run.userId));
  if (!owner?.email) return;
  const weakness = report.weaknesses[0];
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await resend.emails.send({
    from: "Wiora <noreply@resend.dev>",
    to: owner.email,
    subject: report.objectiveJudgment.slice(0, 120) || "Your preparation report",
    html: `
      <p>${report.objectiveJudgment}</p>
      ${weakness ? `<p>${weakness.whatWentWrong}</p>` : ""}
      <p>Next practice: ${report.nextPractice.focus}</p>
      <p><a href="${origin}/preparations/${preparation.id}">Open the preparation</a></p>
    `,
  });
}

export async function enqueuePendingReports(): Promise<void> {
  const rows = await db
    .select({ id: simulationRuns.id })
    .from(simulationRuns)
    .where(and(
      eq(simulationRuns.status, "processing"),
      isNotNull(simulationRuns.transcriptUrl),
      isNull(simulationRuns.report),
    ));
  for (const row of rows) {
    await inngest.send({
      name: "runs/report",
      data: { runId: row.id },
    });
  }
}
