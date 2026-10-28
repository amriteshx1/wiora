import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, researchFindings } from "@/db/schema";
import { respondJson, respondWithWebSearch } from "@/lib/openai-text";

import { getPack, type IntakeContext } from "../types";

const findingCategories = ["verified", "source_backed", "inference", "assumption", "unknown"] as const;
const prioritySources = ["interview_experience", "linkedin", "reddit"] as const;

const plannerSchema = z.object({
  shouldResearch: z.boolean(),
  namedPublicOrganization: z.boolean(),
  queries: z.array(z.string()),
});

const searchSchema = z.object({
  findings: z.array(z.object({
    statement: z.string(),
    category: z.enum(findingCategories),
    sourceUrl: z.string().nullable(),
    sourceTitle: z.string().nullable(),
    query: z.string().nullable(),
  })),
  emptyPrioritySources: z.array(z.enum(prioritySources)),
});

const priorityStatements: Record<(typeof prioritySources)[number], string> = {
  interview_experience: "No usable interview-experience pages were found for this situation.",
  linkedin: "No usable LinkedIn posts or comments were found for this situation.",
  reddit: "No usable Reddit threads were found for this situation.",
};

function asContext(value: unknown): IntakeContext {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntakeContext;
  }
  return {};
}

async function replaceFindings(
  preparationId: string,
  rows: {
    statement: string;
    category: string;
    sourceUrl: string | null;
    sourceTitle: string | null;
    query: string | null;
  }[],
) {
  await db.delete(researchFindings).where(eq(researchFindings.preparationId, preparationId));
  if (rows.length === 0) {
    return;
  }
  await db.insert(researchFindings).values(rows.slice(0, 12).map((row) => ({
    preparationId,
    statement: row.statement,
    category: row.category,
    sourceUrl: row.sourceUrl,
    sourceTitle: row.sourceTitle,
    query: row.query,
  })));
}

export async function researchPreparation(preparationId: string): Promise<void> {
  const [preparation] = await db
    .select()
    .from(preparations)
    .where(eq(preparations.id, preparationId));

  if (!preparation) {
    return;
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

  const context = asContext(preparation.context);
  let plan: z.infer<typeof plannerSchema>;
  try {
    plan = await respondJson({
      schema: plannerSchema,
      name: "research_plan",
      input: [
        "Decide whether public research would make one upcoming conversation more realistic.",
        "Do not search the web.",
        "Return at most 8 queries.",
        "Reported questions are patterns, not a script. A missing interviewer name stays unknown.",
        "Leadership and difficult conversations are researched only when the user named a public organization or a public situation.",
        "namedPublicOrganization is true only when the user named a company, school, government agency, or another organization that has public pages. A person, roommate, family member, manager, or unnamed team is not a public organization.",
        "If namedPublicOrganization is false for a leadership or difficult conversation, shouldResearch must be false.",
        "When the situation has a company, role, interview process, customer, investor, counterparty, or other public context, the first queries target, in order: TakeYouForward and other interview-experience pages, then LinkedIn posts and comments, then Reddit. Those are the first places to look, not a closed list. Later queries cover official pages, recent news, forums, blogs, and other credible public sources.",
        `Conversation type: ${preparation.conversationType}`,
        `Research hints: ${pack.researchHints}`,
        `Context: ${JSON.stringify(context)}`,
        `Document readings: ${JSON.stringify(documents.map((document) => ({
          fileName: document.fileName,
          reading: document.reading,
        })))}`,
      ].join("\n\n"),
    });
  } catch {
    await replaceFindings(preparation.id, [{
      statement: "Public research could not be planned for this situation.",
      category: "unknown",
      sourceUrl: null,
      sourceTitle: null,
      query: null,
    }]);
    return;
  }

  const privateConversation = preparation.conversationType === "leadership" || preparation.conversationType === "difficult_conversation";
  if (!plan.shouldResearch || (privateConversation && !plan.namedPublicOrganization)) {
    await replaceFindings(preparation.id, [{
      statement: "Public research was not useful for this situation.",
      category: "unknown",
      sourceUrl: null,
      sourceTitle: null,
      query: null,
    }]);
    return;
  }

  const queries = plan.queries.map((query) => query.trim()).filter(Boolean).slice(0, 8);
  try {
    const searched = await respondWithWebSearch({
      schema: searchSchema,
      name: "research_findings",
      input: [
        "Search the public web for this one situation. Do not search unrelated topics.",
        "Search the priority sources before the broader web, in this order: TakeYouForward and other interview-experience pages, LinkedIn posts and comments, Reddit, then official pages, news, forums, blogs, and other credible sources.",
        "Reported questions are patterns, not a script. Do not invent an interviewer.",
        "Return at most 12 findings.",
        "If a priority source has no usable result, list it in emptyPrioritySources. Otherwise leave it out.",
        "Use category verified or source_backed only when a source supports the statement. Use inference, assumption, or unknown for the rest.",
        `Queries, in order: ${JSON.stringify(queries)}`,
        `Context: ${JSON.stringify(context)}`,
      ].join("\n\n"),
    });

    const findings = searched.findings.map((finding) => ({
      statement: finding.statement,
      category: finding.category,
      sourceUrl: finding.sourceUrl,
      sourceTitle: finding.sourceTitle,
      query: finding.query,
    }));

    for (const source of searched.emptyPrioritySources) {
      findings.push({
        statement: priorityStatements[source],
        category: "unknown",
        sourceUrl: null,
        sourceTitle: null,
        query: null,
      });
    }

    if (findings.length === 0) {
      findings.push({
        statement: "Public research did not return a usable result for this situation.",
        category: "unknown",
        sourceUrl: null,
        sourceTitle: null,
        query: null,
      });
    }

    await replaceFindings(preparation.id, findings.slice(0, 12));
  } catch {
    await replaceFindings(preparation.id, [{
      statement: "Public research could not be completed for this situation.",
      category: "unknown",
      sourceUrl: null,
      sourceTitle: null,
      query: null,
    }]);
  }
}
