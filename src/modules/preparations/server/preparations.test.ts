import { describe, expect, it } from "vitest";

import { intakeGroups, preparationPacks } from "../types";
import { researchInputFingerprint, researchInputsChanged, shouldReuseResearch, shouldSynthesizeOnly } from "./rerun-rules";

const none: string[] = [];

describe("hasMinimum", () => {
  it("requires a company and a role, description, or resume for an interview", () => {
    const pack = preparationPacks.job_interview;
    expect(pack.hasMinimum({}, none)).toBe(false);
    expect(pack.hasMinimum({ company: "Acme" }, none)).toBe(false);
    expect(pack.hasMinimum({ company: "  ", jobTitle: "Engineer" }, none)).toBe(false);
    expect(pack.hasMinimum({ company: "Acme", jobTitle: "Engineer" }, none)).toBe(true);
    expect(pack.hasMinimum({ company: "Acme", jobDescription: "Build systems" }, none)).toBe(true);
    expect(pack.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "resume" }] }, none)).toBe(false);
    expect(pack.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "resume" }] }, ["doc"])).toBe(true);
    expect(pack.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "extra" }] }, ["doc"])).toBe(false);
  });

  it("accepts a startup description or a confirmed deck", () => {
    const pack = preparationPacks.investor_pitch;
    expect(pack.hasMinimum({}, none)).toBe(false);
    expect(pack.hasMinimum({ startupDescription: "Tools" }, none)).toBe(true);
    expect(pack.hasMinimum({ documents: [{ id: "deck", slot: "deck" }] }, ["deck"])).toBe(true);
    expect(pack.hasMinimum({ documents: [{ id: "deck", slot: "deck" }] }, none)).toBe(false);
  });

  it("requires a client and a product or proposal", () => {
    const pack = preparationPacks.sales_call;
    expect(pack.hasMinimum({ client: "Northwind" }, none)).toBe(false);
    expect(pack.hasMinimum({ client: "Northwind", product: "Platform" }, none)).toBe(true);
    expect(pack.hasMinimum({ client: "Northwind", documents: [{ id: "p", slot: "proposal" }] }, ["p"])).toBe(true);
    expect(pack.hasMinimum({ client: "Northwind", documents: [{ id: "p", slot: "supporting" }] }, ["p"])).toBe(false);
  });

  it("requires a subject and a desired outcome for negotiation", () => {
    const pack = preparationPacks.negotiation;
    expect(pack.hasMinimum({ subject: "Price" }, none)).toBe(false);
    expect(pack.hasMinimum({ subject: "Price", desiredOutcome: "Hold the rate" }, none)).toBe(true);
  });

  it("keeps leadership and difficult conversations separate with the same minimum", () => {
    expect(preparationPacks.leadership.id).toBe("leadership");
    expect(preparationPacks.difficult_conversation.id).toBe("difficult_conversation");
    expect(preparationPacks.leadership.label).not.toBe(preparationPacks.difficult_conversation.label);
    expect(preparationPacks.leadership.hasMinimum({ situation: "Late work" }, none)).toBe(false);
    expect(preparationPacks.leadership.hasMinimum({ situation: "Late work", desiredOutcome: "A new date" }, none)).toBe(true);
    expect(preparationPacks.difficult_conversation.hasMinimum({ situation: "A broken promise", desiredOutcome: "A repair" }, none)).toBe(true);
  });

  it("requires situation and desired outcome for a performance review", () => {
    const pack = preparationPacks.performance_review;
    expect(pack.hasMinimum({ situation: "Q4 cycle" }, none)).toBe(false);
    expect(pack.hasMinimum({ situation: "Q4 cycle", desiredOutcome: "A promotion discussion" }, none)).toBe(true);
  });

  it("requires a client and what went wrong for an escalation", () => {
    const pack = preparationPacks.customer_escalation;
    expect(pack.hasMinimum({ client: "Northwind" }, none)).toBe(false);
    expect(pack.hasMinimum({ client: "Northwind", situation: "Missed SLA" }, none)).toBe(true);
  });

  it("requires a partner and a desired outcome for a partnership meeting", () => {
    const pack = preparationPacks.partnership_meeting;
    expect(pack.hasMinimum({ counterparty: "Northwind" }, none)).toBe(false);
    expect(pack.hasMinimum({ counterparty: "Northwind", desiredOutcome: "A pilot" }, none)).toBe(true);
  });

  it("requires a topic or an outlet with talking points for a media interview", () => {
    const pack = preparationPacks.media_interview;
    expect(pack.hasMinimum({}, none)).toBe(false);
    expect(pack.hasMinimum({ subject: "Product launch" }, none)).toBe(true);
    expect(pack.hasMinimum({ outlet: "Tech Daily", talkingPoints: "Reliability" }, none)).toBe(true);
  });

  it("requires a desired outcome and a company or subject for salary negotiation", () => {
    const pack = preparationPacks.salary_negotiation;
    expect(pack.hasMinimum({ desiredOutcome: "180k" }, none)).toBe(false);
    expect(pack.hasMinimum({ company: "Acme", desiredOutcome: "180k" }, none)).toBe(true);
  });

  it("requires the person and a desired outcome for networking", () => {
    const pack = preparationPacks.networking_conversation;
    expect(pack.hasMinimum({ people: "A VP of product" }, none)).toBe(false);
    expect(pack.hasMinimum({ people: "A VP of product", desiredOutcome: "A follow-up" }, none)).toBe(true);
  });

  it("requires a description for custom and stores no fixed dimensions", () => {
    expect(preparationPacks.custom.hasMinimum({}, none)).toBe(false);
    expect(preparationPacks.custom.hasMinimum({ description: "   " }, none)).toBe(false);
    expect(preparationPacks.custom.hasMinimum({ description: "A board update" }, none)).toBe(true);
    expect(preparationPacks.custom.evaluationDimensions).toEqual([]);
  });
});

describe("intakeGroups", () => {
  it("keeps the product section titles and counts", () => {
    expect(intakeGroups(preparationPacks.job_interview).map((group) => group.title)).toEqual([
      "Role",
      "Materials",
      "People",
      "You",
    ]);
    expect(intakeGroups(preparationPacks.investor_pitch).map((group) => group.title)).toEqual([
      "The company",
      "Materials",
      "The investor",
      "You",
    ]);
    expect(intakeGroups(preparationPacks.sales_call).map((group) => group.title)).toEqual([
      "The call",
      "Materials",
      "People",
    ]);
    expect(intakeGroups(preparationPacks.negotiation).map((group) => group.title)).toEqual([
      "The deal",
      "Materials",
      "The other side",
    ]);
    expect(intakeGroups(preparationPacks.leadership).map((group) => group.title)).toEqual([
      "The conversation",
      "People",
      "Limits",
      "Materials",
    ]);
    expect(intakeGroups(preparationPacks.difficult_conversation).map((group) => group.title)).toEqual([
      "The conversation",
      "People",
      "Limits",
      "Materials",
    ]);
    expect(intakeGroups(preparationPacks.performance_review).map((group) => group.title)).toEqual([
      "The review",
      "Work so far",
      "People",
      "Materials",
    ]);
    expect(intakeGroups(preparationPacks.customer_escalation).map((group) => group.title)).toEqual([
      "The issue",
      "Materials",
      "People",
    ]);
    expect(intakeGroups(preparationPacks.partnership_meeting).map((group) => group.title)).toEqual([
      "The opportunity",
      "Materials",
      "People",
    ]);
    expect(intakeGroups(preparationPacks.media_interview).map((group) => group.title)).toEqual([
      "The appearance",
      "Materials",
      "People",
    ]);
    expect(intakeGroups(preparationPacks.salary_negotiation).map((group) => group.title)).toEqual([
      "The offer",
      "The terms",
      "The other side",
      "Materials",
    ]);
    expect(intakeGroups(preparationPacks.networking_conversation).map((group) => group.title)).toEqual([
      "The conversation",
      "You",
      "Materials",
    ]);
    expect(intakeGroups(preparationPacks.custom).map((group) => group.title)).toEqual([
      "The situation",
      "Materials",
    ]);
  });
});

describe("researchInputsChanged", () => {
  it("is true when a watched field or the document set changes", () => {
    expect(researchInputsChanged({ company: "Acme" }, { company: "Initech" }, [], [])).toBe(true);
    expect(researchInputsChanged({ jobTitle: "Engineer" }, { jobTitle: "Manager" }, [], [])).toBe(true);
    expect(researchInputsChanged({ role: "Engineer" }, { role: "Manager" }, [], [])).toBe(true);
    expect(researchInputsChanged({ investor: "North" }, { investor: "South" }, [], [])).toBe(true);
    expect(researchInputsChanged({ client: "A" }, { client: "B" }, [], [])).toBe(true);
    expect(researchInputsChanged({ counterparty: "A" }, { counterparty: "B" }, [], [])).toBe(true);
    expect(researchInputsChanged({ subject: "Price" }, { subject: "Scope" }, [], [])).toBe(true);
    expect(researchInputsChanged({}, {}, ["a"], ["a", "b"])).toBe(true);
    expect(researchInputsChanged({}, {}, ["a", "b"], ["a"])).toBe(true);
  });

  it("is false for the same inputs, spacing, or an unwatched field", () => {
    expect(researchInputsChanged({ company: "Acme" }, { company: " Acme " }, ["b", "a"], ["a", "b"])).toBe(false);
    expect(researchInputsChanged({ concerns: "Pace" }, { concerns: "Depth" }, ["a"], ["a"])).toBe(false);
  });

  it("fingerprints watched fields and document ids", () => {
    expect(researchInputFingerprint({ company: "Acme" }, ["b", "a"]))
      .toBe(researchInputFingerprint({ company: " Acme " }, ["a", "b"]));
    expect(researchInputFingerprint({ company: "Acme" }, ["a"]))
      .not.toBe(researchInputFingerprint({ company: "Initech" }, ["a"]));
  });

  it("reuses research only when the fingerprint matches and findings exist", () => {
    const fingerprint = researchInputFingerprint({ company: "Acme" }, ["a"]);
    expect(shouldSynthesizeOnly(fingerprint, fingerprint)).toBe(true);
    expect(shouldReuseResearch(fingerprint, fingerprint, 2)).toBe(true);
    expect(shouldReuseResearch(fingerprint, fingerprint, 0)).toBe(false);
    expect(shouldReuseResearch(null, fingerprint, 2)).toBe(false);
    expect(shouldReuseResearch(fingerprint, researchInputFingerprint({ company: "Figma" }, ["a"]), 2)).toBe(false);
  });
});
