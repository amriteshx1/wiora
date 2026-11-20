type Passage = { quote?: string; whyItMatters?: string };

type Reading = {
  summary?: string;
  claims?: string[];
  requirements?: string[];
  numbers?: string[];
  people?: string[];
  passages?: Passage[];
};

function asReading(value: unknown): Reading | null {
  if (!value || typeof value !== "object") return null;
  return value as Reading;
}

export function compactDocumentReadings(
  documents: Array<{ fileName: string; reading: unknown }>,
): Array<{
  fileName: string;
  summary?: string;
  claims?: string[];
  requirements?: string[];
  numbers?: string[];
  people?: string[];
  passages?: Passage[];
}> {
  return documents.map((document) => {
    const reading = asReading(document.reading);
    return {
      fileName: document.fileName,
      summary: reading?.summary,
      claims: reading?.claims?.slice(0, 8),
      requirements: reading?.requirements?.slice(0, 8),
      numbers: reading?.numbers?.slice(0, 8),
      people: reading?.people?.slice(0, 8),
      passages: reading?.passages?.slice(0, 6),
    };
  });
}

const researchFields = [
  "company",
  "role",
  "jobTitle",
  "investor",
  "client",
  "counterparty",
  "subject",
  "startupDescription",
  "description",
  "situation",
  "industry",
] as const;

export function compactIntakeForResearch(context: Record<string, unknown>): Record<string, string> {
  const compact: Record<string, string> = {};
  for (const field of researchFields) {
    const value = context[field];
    if (typeof value === "string" && value.trim()) {
      compact[field] = value.trim().slice(0, 240);
    }
  }
  return compact;
}

export function compactSituation(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const model = value as {
    counterpartName?: string;
    counterpartObjective?: string;
    knownFacts?: string[];
    unknowns?: string[];
    areas?: Array<{ id: string; label: string; priority: number; exitCriteria: string }>;
    conversationStyle?: unknown;
    evaluationDimensions?: unknown;
  };
  return {
    counterpartName: model.counterpartName,
    counterpartObjective: model.counterpartObjective,
    knownFacts: model.knownFacts?.slice(0, 12),
    unknowns: model.unknowns?.slice(0, 8),
    areas: model.areas?.map((area) => ({
      id: area.id,
      label: area.label,
      priority: area.priority,
      exitCriteria: area.exitCriteria,
    })),
    conversationStyle: model.conversationStyle,
    evaluationDimensions: model.evaluationDimensions,
  };
}
