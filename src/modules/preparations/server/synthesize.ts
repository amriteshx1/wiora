import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, researchFindings } from "@/db/schema";
import { respondJson } from "@/lib/openai-text";

import { getPack, type IntakeContext } from "../types";

const styleLevel = {
  depth: ["surface", "mixed", "deep"] as const,
  skepticism: ["low", "moderate", "high"] as const,
  detail: ["practical", "mixed", "thorough"] as const,
  pace: ["unhurried", "normal", "brisk"] as const,
  interruption: ["rare", "normal", "frequent"] as const,
};

export const situationModelSchema = z.object({
  parties: z.string(),
  userGoal: z.string(),
  otherSideGoal: z.string(),
  incentives: z.string(),
  knownFacts: z.array(z.string()),
  unknowns: z.array(z.string()),
  whatMatters: z.string(),
  howItCanGoBadly: z.string(),
  likelyChallenges: z.array(z.string()),
  whatUserMustDemonstrate: z.array(z.string()),
  evidenceThatWouldConvince: z.array(z.string()),
  counterpartConcerns: z.array(z.string()),
  counterpartObjective: z.string(),
  areas: z.array(z.object({
    id: z.string(),
    label: z.string(),
    whyItMatters: z.string(),
    priority: z.number().int(),
    exitCriteria: z.string(),
    documentAnchors: z.array(z.string()),
  })),
  patternWeights: z.array(z.object({
    pattern: z.string(),
    areaId: z.string(),
  })),
  conversationStyle: z.object({
    depth: z.enum(styleLevel.depth),
    skepticism: z.enum(styleLevel.skepticism),
    detail: z.enum(styleLevel.detail),
    pace: z.enum(styleLevel.pace),
    interruption: z.enum(styleLevel.interruption),
    rationale: z.string(),
  }),
  evaluationDimensions: z.array(z.object({
    name: z.string(),
    whatGoodLooksLike: z.string(),
  })),
  counterpartName: z.string(),
});

export type SituationModel = z.infer<typeof situationModelSchema>;

function asContext(value: unknown): IntakeContext {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntakeContext;
  }
  return {};
}

function readingQuotes(readings: unknown[]): string[] {
  const quotes: string[] = [];
  for (const reading of readings) {
    if (!reading || typeof reading !== "object" || !("passages" in reading)) {
      continue;
    }
    const passages = (reading as { passages?: { quote?: string }[] }).passages;
    if (!Array.isArray(passages)) {
      continue;
    }
    for (const passage of passages) {
      if (typeof passage?.quote === "string" && passage.quote.trim()) {
        quotes.push(passage.quote.trim());
      }
    }
  }
  return quotes;
}

export async function synthesizePreparation(preparationId: string): Promise<SituationModel> {
  const [preparation] = await db
    .select()
    .from(preparations)
    .where(eq(preparations.id, preparationId));

  if (!preparation) {
    throw new Error("Preparation not found");
  }

  const pack = getPack(preparation.conversationType);
  if (!pack) {
    throw new Error("Unknown conversation type");
  }

  const documents = await db
    .select({
      fileName: preparationDocuments.fileName,
      reading: preparationDocuments.reading,
    })
    .from(preparationDocuments)
    .where(eq(preparationDocuments.preparationId, preparation.id));

  const findings = await db
    .select({
      statement: researchFindings.statement,
      category: researchFindings.category,
      sourceUrl: researchFindings.sourceUrl,
      sourceTitle: researchFindings.sourceTitle,
    })
    .from(researchFindings)
    .where(eq(researchFindings.preparationId, preparation.id));

  const context = asContext(preparation.context);
  const model = await respondJson({
    schema: situationModelSchema,
    name: "situation_model",
    input: [
      "Build one situation model for one real upcoming conversation.",
      "Use only the context, document readings, and research findings. Do not add another person's private information.",
      "Treat context.corrections.addedFacts as facts the user confirmed. Do not bring back a finding the user removed.",
      "documentAnchors must be short quotes copied from the document readings or from text the user supplied. Do not paraphrase an anchor.",
      "patternWeights is required. Use an empty array unless this is a job interview and the research contains a reported interview pattern.",
      "Do not ask for or assign a user difficulty.",
      "For an interview, derive conversationStyle from the company, role, job description, candidate context, and public interview experiences. Deep reported interviews set depth to deep. Shallow reported interviews set depth to surface. If research has no reliable pattern, infer from the role and documents and say that in rationale.",
      "For every other type, derive conversationStyle from the counterpart's goal, the relationship or industry, and the evidence they would need.",
      "counterpartName is a role such as Interviewer at the company, or the person the user named. Never invent a person from research.",
      preparation.conversationType === "custom"
        ? "This is a custom conversation. Fill evaluationDimensions from the description."
        : "Ignore evaluationDimensions for the stored pack. You may return an empty array.",
      `Conversation type: ${preparation.conversationType}`,
      `Pack counterpart objective: ${pack.counterpartObjective}`,
      `Pack behavior notes: ${pack.behaviorNotes}`,
      `Context: ${JSON.stringify(context)}`,
      `Document readings: ${JSON.stringify(documents)}`,
      `Findings: ${JSON.stringify(findings)}`,
    ].join("\n\n"),
  });

  const hasPattern = findings.some((finding) =>
    finding.category === "verified" || finding.category === "source_backed",
  );
  const quotes = readingQuotes(documents.map((document) => document.reading));
  const areas = model.areas.map((area) => ({ ...area, documentAnchors: [...area.documentAnchors] }));
  if (areas.length === 0) {
    areas.push({
      id: "supplied-material",
      label: "Supplied material",
      whyItMatters: "The conversation has to stay attached to what the user provided.",
      priority: 1,
      exitCriteria: "The counterpart has used the supplied material.",
      documentAnchors: [],
    });
  }
  const joined = () => areas.flatMap((area) => area.documentAnchors).join("\n");
  const missing = quotes.filter((quote) => !joined().includes(quote)).slice(0, 3);
  areas[0].documentAnchors.push(...missing);
  const jobDescription = typeof context.jobDescription === "string" ? context.jobDescription.trim() : "";
  const jobSentence = jobDescription.split(/(?<=\.)\s/)[0]?.slice(0, 240).trim() ?? "";
  if (jobSentence.length > 20 && !joined().includes(jobSentence.slice(0, 40))) {
    areas[0].documentAnchors.push(jobSentence);
  }

  return {
    ...model,
    areas,
    patternWeights: preparation.conversationType === "job_interview" && hasPattern
      ? model.patternWeights
      : [],
    counterpartObjective: preparation.conversationType === "custom"
      ? model.counterpartObjective
      : pack.counterpartObjective,
    evaluationDimensions: preparation.conversationType === "custom"
      ? model.evaluationDimensions
      : pack.evaluationDimensions.map((name) => ({
          name,
          whatGoodLooksLike: name,
        })),
    conversationStyle: {
      ...model.conversationStyle,
      rationale: model.conversationStyle.rationale.trim() || "Inferred from the situation and the supplied documents.",
    },
  };
}
