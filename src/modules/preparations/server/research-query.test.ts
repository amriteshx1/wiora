import { describe, expect, it } from "vitest";

import { buildBraveQuery } from "./research-query";

describe("buildBraveQuery", () => {
  it("targets company, role, and priority sources for an interview", () => {
    const query = buildBraveQuery("job_interview", {
      company: "Acme",
      jobTitle: "Software Engineer",
    });
    expect(query).toContain("Acme");
    expect(query).toContain("Software Engineer");
    expect(query).toContain("site:reddit.com");
    expect(query).toContain("site:linkedin.com");
    expect(query).toContain("site:takeyouforward.com");
    expect(query.split(/\s+/).length).toBeLessThanOrEqual(75);
    expect(query.length).toBeLessThanOrEqual(600);
  });

  it("uses the named investor for a pitch", () => {
    const query = buildBraveQuery("investor_pitch", { investor: "North Capital" });
    expect(query).toContain("North Capital");
    expect(query).toContain("thesis");
  });

  it("does not invent an empty private leadership query from a person-only situation", () => {
    const query = buildBraveQuery("leadership", { situation: "A late project with my manager" });
    expect(query.length).toBeGreaterThan(0);
    expect(query.length).toBeLessThanOrEqual(600);
  });

  it("targets the remaining conversation types without exceeding query limits", () => {
    const sales = buildBraveQuery("sales_call", { client: "Northwind", company: "Acme" });
    const negotiation = buildBraveQuery("negotiation", { counterparty: "Northwind", subject: "Renewal" });
    const difficult = buildBraveQuery("difficult_conversation", { company: "Acme", situation: "A missed deadline" });
    const review = buildBraveQuery("performance_review", { company: "Acme", situation: "Q4 cycle" });
    const escalation = buildBraveQuery("customer_escalation", { client: "Northwind", situation: "Outage" });
    const partnership = buildBraveQuery("partnership_meeting", { counterparty: "Northwind", subject: "Joint go-to-market" });
    const media = buildBraveQuery("media_interview", { outlet: "Tech Daily", subject: "Launch" });
    const salary = buildBraveQuery("salary_negotiation", { company: "Acme", jobTitle: "Engineer" });
    const networking = buildBraveQuery("networking_conversation", { company: "Acme", people: "A VP of product" });
    const custom = buildBraveQuery("custom", { company: "Acme", description: "A board update" });
    for (const query of [sales, negotiation, difficult, review, escalation, partnership, media, salary, networking, custom]) {
      expect(query.length).toBeGreaterThan(0);
      expect(query.length).toBeLessThanOrEqual(600);
      expect(query.split(/\s+/).length).toBeLessThanOrEqual(75);
    }
    expect(sales).toContain("Northwind");
    expect(negotiation).toContain("Renewal");
    expect(escalation).toContain("Northwind");
    expect(media).toContain("Tech Daily");
    expect(salary).toContain("Acme");
  });
});
