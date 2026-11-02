import { describe, expect, it } from "vitest";

import { renderBrief, type BriefSituation } from "./brief";
import { eagerness } from "./eagerness";
import { durationForProduct } from "./products";
import { withClock, type SessionState } from "./steer";

const situation: BriefSituation = {
  counterpartName: "Interviewer at Stripe",
  counterpartObjective: "Determine whether the candidate appears prepared and capable for the role.",
  knownFacts: ["The candidate led the ledger migration.", "The company is Stripe."],
  unknowns: ["The interviewer name is unknown."],
  areas: [
    {
      id: "clock",
      label: "Session clock",
      priority: 1,
      exitCriteria: "The candidate explains the clock.",
      documentAnchors: ["WioraLedger migration cut latency by 37 percent"],
    },
    {
      id: "extra",
      label: "Extra",
      priority: 9,
      exitCriteria: "Leave this until later.",
      documentAnchors: ["low priority anchor"],
    },
  ],
  patternWeights: [{ pattern: "Candidates describe a practical round", areaId: "clock" }],
  conversationStyle: {
    depth: "deep",
    skepticism: "moderate",
    detail: "thorough",
    pace: "normal",
    interruption: "normal",
    rationale: "Inferred from the role and the supplied documents.",
  },
};

describe("renderBrief", () => {
  it("includes the conversation style and the coaching ban", () => {
    const text = renderBrief({
      situationModel: situation,
      findings: [{ statement: "The company is Stripe.", category: "source_backed" }],
      durationMinutes: 30,
      minutesRemaining: 30,
      sessionState: null,
      drillStrategy: null,
      nextPracticeFocus: null,
    });

    expect(text).toContain("This is practice. Never tell the user what answer to give.");
    expect(text).toContain("Depth: deep");
    expect(text).toContain("Skepticism: moderate");
    expect(text).toContain("Detail: thorough");
    expect(text).toContain("Pace: normal");
    expect(text).toContain("Interruption: normal");
    expect(text).toContain("Inferred from the role and the supplied documents.");
    expect(text).not.toContain("pressure");
    expect(text.startsWith("This is practice.")).toBe(true);
  });

  it("drops the lowest-priority anchors before failing", () => {
    const bulky = "anchor ".repeat(4000);
    const text = renderBrief({
      situationModel: {
        ...situation,
        areas: [
          { ...situation.areas[0], documentAnchors: ["keep this high priority anchor"] },
          { ...situation.areas[1], documentAnchors: [bulky, bulky] },
        ],
      },
      findings: [],
      durationMinutes: 30,
      minutesRemaining: 30,
      sessionState: null,
      drillStrategy: null,
      nextPracticeFocus: null,
    });

    expect(text).toContain("keep this high priority anchor");
    expect(text).not.toContain(bulky);
    expect(Math.ceil(text.length / 4)).toBeLessThanOrEqual(8000);
  });

  it("throws when the brief is still too long after the anchors are gone", () => {
    expect(() => renderBrief({
      situationModel: {
        ...situation,
        knownFacts: ["fact ".repeat(20000)],
        areas: [{ ...situation.areas[0], documentAnchors: ["short"] }],
      },
      findings: [],
      durationMinutes: 30,
      minutesRemaining: 30,
      sessionState: null,
      drillStrategy: null,
      nextPracticeFocus: null,
    })).toThrow("The brief is too long");
  });
});

describe("products", () => {
  it("maps a product id to the right minutes", () => {
    process.env.POLAR_PRODUCT_30 = "prod_30";
    process.env.POLAR_PRODUCT_45 = "prod_45";
    process.env.POLAR_PRODUCT_60 = "prod_60";
    expect(durationForProduct("prod_30")).toBe(30);
    expect(durationForProduct("prod_45")).toBe(45);
    expect(durationForProduct("prod_60")).toBe(60);
    expect(durationForProduct("other")).toBeNull();
  });
});

describe("eagerness", () => {
  it("follows interruption and pace", () => {
    expect(eagerness({ interruption: "rare", pace: "normal" })).toBe("low");
    expect(eagerness({ interruption: "rare", pace: "unhurried" })).toBe("low");
    expect(eagerness({ interruption: "frequent", pace: "normal" })).toBe("high");
    expect(eagerness({ interruption: "rare", pace: "brisk" })).toBe("high");
    expect(eagerness({ interruption: "normal", pace: "brisk" })).toBe("high");
    expect(eagerness({ interruption: "normal", pace: "normal" })).toBe("medium");
  });
});

describe("steering clock", () => {
  it("sets wrap_up under three minutes", () => {
    const state: SessionState = {
      areas: [{ id: "clock", status: "probing", evidence: "The answer was vague." }],
      claims: [],
      contradictions: [],
      uncertainties: [],
      nextAction: "dig_deeper",
      nextFocusAreaId: "clock",
      note: "Ask for an example.",
    };
    expect(withClock(state, 2).nextAction).toBe("wrap_up");
    expect(withClock(state, 3).nextAction).toBe("wrap_up");
    expect(withClock(state, 12).nextAction).toBe("dig_deeper");
  });
});
