import { describe, expect, it } from "vitest";

import { renderBrief, type BriefSituation } from "./brief";
import { attachQuotes, type QuoteCheckedReport } from "./quotes";

const lines = [
  { text: "I kind of did some things and I do not remember the details.", startTs: 12000 },
  { text: "Walk me through the ledger migration.", startTs: 40000 },
];

const report: QuoteCheckedReport = {
  transcriptSource: "session_turns",
  objectiveJudgment: "The answer stayed vague.",
  preparedness: "Not ready to defend the migration.",
  dimensions: [{ name: "resume credibility", assessment: "Thin.", quote: "I kind of did some things and I do not remember the details." }],
  strengths: [{ statement: "They named the topic.", quote: "not in the transcript" }],
  demonstrated: [],
  uncertain: [],
  weaknesses: [
    {
      id: "vague",
      whatWentWrong: "The answer named no action.",
      whyItWasProblematic: "The counterpart cannot tell what the candidate did.",
      whatWasExpected: "A concrete example.",
      whatAStrongAnswerWouldHaveDemonstrated: "The decision, the constraint, and the result.",
      missingEvidence: "No measured result.",
      quote: "I kind of did some things and I do not remember the details.",
      areaId: "clock",
    },
    {
      id: "invented",
      whatWentWrong: "A quote that never happened.",
      whyItWasProblematic: "It is not evidence.",
      whatWasExpected: "A real line.",
      whatAStrongAnswerWouldHaveDemonstrated: "A real line.",
      missingEvidence: "",
      quote: "I redesigned the entire billing system overnight.",
      areaId: "clock",
    },
  ],
  moments: [{ id: "m1", kind: "weakness", statement: "Vague.", quote: "I kind of did some things and I do not remember the details." }],
  counterpartConcerns: [],
  nextPractice: { focus: "Defend one migration decision.", why: "The last answer had no decision.", suggestedMinutes: 30 },
};

const situation: BriefSituation = {
  counterpartName: "Interviewer at Stripe",
  counterpartObjective: "Determine whether the candidate appears prepared.",
  knownFacts: ["The company is Stripe."],
  unknowns: [],
  areas: [],
  patternWeights: [],
  conversationStyle: {
    depth: "deep",
    skepticism: "moderate",
    detail: "thorough",
    pace: "normal",
    interruption: "normal",
    rationale: "Inferred from the role.",
  },
};

describe("attachQuotes", () => {
  it("drops a weakness whose quote is not in the transcript and stamps a match", () => {
    const checked = attachQuotes(report, lines);
    expect(checked.weaknesses.map((item) => item.id)).toEqual(["vague"]);
    expect(checked.weaknesses[0]?.startTs).toBe(12000);
    expect(checked.strengths).toEqual([]);
    expect(checked.dimensions[0]?.startTs).toBe(12000);
    expect(checked.moments[0]?.startTs).toBe(12000);
  });
});

describe("replay brief", () => {
  it("contains the different angle, the banned quote, and the coaching ban", () => {
    const text = renderBrief({
      situationModel: situation,
      findings: [],
      durationMinutes: 30,
      minutesRemaining: 30,
      sessionState: null,
      drillStrategy: {
        whyTheLastAnswerFailed: "The answer named no action.",
        whatAStrongAnswerMustShow: "A decision and a result.",
        differentScenario: "Ask about a rollback that happened the week after launch.",
        bannedQuote: "I kind of did some things and I do not remember the details.",
      },
      nextPracticeFocus: null,
    });
    expect(text).toContain("Ask about a rollback that happened the week after launch.");
    expect(text).toContain("I kind of did some things and I do not remember the details.");
    expect(text).toContain("Do not ask this previous quote");
    expect(text).toContain("This is practice. Never tell the user what answer to give.");
  });
});
