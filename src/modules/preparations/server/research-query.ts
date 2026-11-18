import type { ConversationType, IntakeContext } from "../types";

function filled(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function quoted(value: string): string {
  const cleaned = value.replace(/"/g, "").slice(0, 80);
  if (!cleaned) return "";
  return cleaned.includes(" ") ? `"${cleaned}"` : cleaned;
}

function clipQuery(query: string): string {
  const words = query.split(/\s+/).filter(Boolean);
  const clipped = words.length > 75 ? words.slice(0, 75).join(" ") : query;
  return clipped.length > 600 ? clipped.slice(0, 600) : clipped;
}

export function buildBraveQuery(
  conversationType: ConversationType,
  context: IntakeContext,
): string {
  const company = quoted(filled(context.company));
  const role = quoted(filled(context.jobTitle) || filled(context.role));
  const investor = quoted(filled(context.investor));
  const client = quoted(filled(context.client));
  const counterparty = quoted(filled(context.counterparty));
  const subject = quoted(filled(context.subject));
  const people = quoted(filled(context.people));
  const description = quoted((filled(context.startupDescription) || filled(context.description) || filled(context.situation)).slice(0, 80));

  const sources = "(interview experience OR interview questions OR site:takeyouforward.com OR site:reddit.com OR site:linkedin.com OR site:glassdoor.com)";
  const publicPages = "(official site OR careers OR about OR news OR site:linkedin.com OR site:reddit.com)";

  let query = "";
  if (conversationType === "job_interview") {
    query = [company, role, sources].filter(Boolean).join(" ");
  } else if (conversationType === "investor_pitch") {
    query = [investor || company, "investor thesis pitch", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "sales_call") {
    query = [client || company, "customer company", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "negotiation") {
    query = [counterparty || company, subject, publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "leadership" || conversationType === "difficult_conversation" || conversationType === "performance_review") {
    query = [company, description, publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "customer_escalation") {
    query = [client || company, "customer company", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "partnership_meeting") {
    query = [counterparty || company, "partnership", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "media_interview") {
    const outlet = quoted(filled(context.outlet));
    query = [outlet || company, subject, "interview", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "salary_negotiation") {
    query = [company, role, "compensation interview", publicPages].filter(Boolean).join(" ");
  } else if (conversationType === "networking_conversation") {
    query = [company, people, publicPages].filter(Boolean).join(" ");
  } else {
    query = [company, client, investor, counterparty, description, publicPages].filter(Boolean).join(" ");
  }

  return clipQuery(query.trim() || "public company interview experience");
}
