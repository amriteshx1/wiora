import { describe, expect, it } from "vitest";

import { preparationPacks } from "../types";
import { researchInputsChanged } from "./rerun-rules";

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

  it("requires a description for custom and stores no fixed dimensions", () => {
    expect(preparationPacks.custom.hasMinimum({}, none)).toBe(false);
    expect(preparationPacks.custom.hasMinimum({ description: "   " }, none)).toBe(false);
    expect(preparationPacks.custom.hasMinimum({ description: "A board update" }, none)).toBe(true);
    expect(preparationPacks.custom.evaluationDimensions).toEqual([]);
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
    expect(researchInputsChanged({}, {}, ["a"], ["a", "b"])).toBe(true);
    expect(researchInputsChanged({}, {}, ["a", "b"], ["a"])).toBe(true);
  });

  it("is false for the same inputs, spacing, or an unwatched field", () => {
    expect(researchInputsChanged({ company: "Acme" }, { company: " Acme " }, ["b", "a"], ["a", "b"])).toBe(false);
    expect(researchInputsChanged({ concerns: "Pace" }, { concerns: "Depth" }, ["a"], ["a"])).toBe(false);
  });
});
