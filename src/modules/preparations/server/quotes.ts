export type TranscriptLine = {
  text: string;
  startTs: number;
};

export type Quoted = {
  quote: string | null;
  startTs?: number;
};

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function matchQuote(quote: string | null, lines: TranscriptLine[]): TranscriptLine | null {
  const needle = normalize(quote ?? "");
  if (!needle) return null;
  for (const line of lines) {
    if (normalize(line.text).includes(needle)) {
      return line;
    }
  }
  return null;
}

type Dimension = { name: string; assessment: string; quote: string | null; startTs?: number };
type Strength = { statement: string; quote: string; startTs?: number };
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
type Moment = {
  id: string;
  kind: "strength" | "weakness" | "missed" | "challenge";
  statement: string;
  quote: string;
  startTs?: number;
};

export type QuoteCheckedReport = {
  transcriptSource: "stream" | "session_turns";
  objectiveJudgment: string;
  preparedness: string;
  dimensions: Dimension[];
  strengths: Strength[];
  demonstrated: string[];
  uncertain: string[];
  weaknesses: Weakness[];
  moments: Moment[];
  counterpartConcerns: string[];
  nextPractice: {
    focus: string;
    why: string;
    suggestedMinutes: 30 | 45 | 60;
  };
};

export function attachQuotes(report: QuoteCheckedReport, lines: TranscriptLine[]): QuoteCheckedReport {
  const dimensions: Dimension[] = [];
  for (const item of report.dimensions) {
    if (!item.quote) {
      dimensions.push({ ...item, quote: null });
      continue;
    }
    const line = matchQuote(item.quote, lines);
    if (!line) continue;
    dimensions.push({ ...item, startTs: line.startTs });
  }

  const strengths: Strength[] = [];
  for (const item of report.strengths) {
    const line = matchQuote(item.quote, lines);
    if (!line) continue;
    strengths.push({ ...item, startTs: line.startTs });
  }

  const weaknesses: Weakness[] = [];
  for (const item of report.weaknesses) {
    const line = matchQuote(item.quote, lines);
    if (!line) continue;
    weaknesses.push({ ...item, startTs: line.startTs });
  }

  const moments: Moment[] = [];
  for (const item of report.moments) {
    const line = matchQuote(item.quote, lines);
    if (!line) continue;
    moments.push({ ...item, startTs: line.startTs });
  }

  return {
    ...report,
    dimensions,
    strengths,
    weaknesses,
    moments,
  };
}
