import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments, preparations, researchFindings } from "@/db/schema";
import { fetchBraveContext } from "@/lib/brave-llm-context";
import { respondJson } from "@/lib/openai-text";
import { logUsage } from "@/lib/usage-log";

import { getPack, type IntakeContext } from "../types";
import { compactDocumentReadings, compactIntakeForResearch } from "./compact-context";
import { buildBraveQuery } from "./research-query";
import { researchInputFingerprint, shouldReuseResearch } from "./rerun-rules";

const findingCategories = ["verified", "source_backed", "inference", "assumption", "unknown"] as const;
const prioritySources = ["interview_experience", "linkedin", "reddit"] as const;

const plannerSchema = z.object({
  shouldResearch: z.boolean(),
  namedPublicOrganization: z.boolean(),
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

type StoredFinding = {
  statement: string;
  category: (typeof findingCategories)[number];
  sourceUrl: string | null;
  sourceTitle: string | null;
  query: string | null;
};

function unknownFinding(statement: string): StoredFinding[] {
  return [{
    statement,
    category: "unknown",
    sourceUrl: null,
    sourceTitle: null,
    query: null,
  }];
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
      id: preparationDocuments.id,
      fileName: preparationDocuments.fileName,
      reading: preparationDocuments.reading,
    })
    .from(preparationDocuments)
    .where(eq(preparationDocuments.preparationId, preparation.id));

  const context = asContext(preparation.context);
  const fingerprint = researchInputFingerprint(context, documents.map((document) => document.id));
  const existing = await db
    .select({ id: researchFindings.id })
    .from(researchFindings)
    .where(eq(researchFindings.preparationId, preparation.id));

  if (shouldReuseResearch(preparation.researchInputHash, fingerprint, existing.length)) {
    logUsage({
      kind: "external_search",
      preparationId: preparation.id,
      reused: true,
      ok: true,
      detail: "fingerprint_match",
    });
    return;
  }

  let plan: z.infer<typeof plannerSchema>;
  try {
    plan = await respondJson({
      schema: plannerSchema,
      name: "research_plan",
      input: [
        "Decide whether public research would make one upcoming conversation more realistic.",
        "Do not search the web.",
        "Reported questions are patterns, not a script. A missing interviewer name stays unknown.",
        "Leadership and difficult conversations are researched only when the user named a public organization or a public situation.",
        "namedPublicOrganization is true only when the user named a company, school, government agency, or another organization that has public pages. A person, roommate, family member, manager, or unnamed team is not a public organization.",
        "If namedPublicOrganization is false for a leadership or difficult conversation, shouldResearch must be false.",
        `Conversation type: ${preparation.conversationType}`,
        `Research hints: ${pack.researchHints}`,
        `Context: ${JSON.stringify(compactIntakeForResearch(context))}`,
        `Document summaries: ${JSON.stringify(compactDocumentReadings(documents))}`,
      ].join("\n\n"),
    });
    logUsage({ kind: "research_planning", preparationId: preparation.id, ok: true });
  } catch {
    logUsage({ kind: "research_planning", preparationId: preparation.id, ok: false });
    await replaceFindings(preparation.id, unknownFinding("Public research could not be planned for this situation."));
    await saveFingerprint(preparation.id, fingerprint);
    return;
  }

  const privateConversation =
    preparation.conversationType === "leadership" ||
    preparation.conversationType === "difficult_conversation" ||
    preparation.conversationType === "performance_review";
  if (!plan.shouldResearch || (privateConversation && !plan.namedPublicOrganization)) {
    await replaceFindings(preparation.id, unknownFinding("Public research was not useful for this situation."));
    await saveFingerprint(preparation.id, fingerprint);
    logUsage({ kind: "external_search", preparationId: preparation.id, reused: false, ok: true, detail: "skipped_private" });
    return;
  }

  const query = buildBraveQuery(pack.id, context);
  let passages: Array<{ url: string; title: string; snippets: string[] }> = [];
  try {
    const searched = await fetchBraveContext(query);
    passages = searched.items.map((item) => ({
      url: item.url,
      title: searched.sources[item.url]?.title || item.title,
      snippets: item.snippets.slice(0, 4),
    }));
    logUsage({
      kind: "external_search",
      preparationId: preparation.id,
      reused: false,
      ok: true,
      sources: passages.length,
      tokens: 6144,
    });
  } catch {
    logUsage({ kind: "external_search", preparationId: preparation.id, reused: false, ok: false });
    await replaceFindings(preparation.id, unknownFinding("Public research could not be completed for this situation."));
    await saveFingerprint(preparation.id, fingerprint);
    return;
  }

  if (passages.length === 0) {
    await replaceFindings(preparation.id, unknownFinding("Public research did not return a usable result for this situation."));
    await saveFingerprint(preparation.id, fingerprint);
    return;
  }

  try {
    const mapped = await respondJson({
      schema: searchSchema,
      name: "research_findings",
      input: [
        "Turn these public web passages into findings for one upcoming conversation.",
        "Do not search the web. Use only the supplied passages.",
        "Return at most 12 findings.",
        "Use category verified or source_backed only when a supplied source supports the statement. Use inference, assumption, or unknown for the rest.",
        "Keep sourceUrl and sourceTitle from the passage that supports the statement.",
        "If a priority source has no usable result, list it in emptyPrioritySources. Priority sources are interview-experience pages, LinkedIn, and Reddit.",
        "Reported questions are patterns, not a script. Do not invent an interviewer.",
        `Query: ${query}`,
        `Context: ${JSON.stringify(compactIntakeForResearch(context))}`,
        `Passages: ${JSON.stringify(passages)}`,
      ].join("\n\n"),
    });

    const findings: StoredFinding[] = mapped.findings.map((finding) => ({
      statement: finding.statement,
      category: finding.category,
      sourceUrl: finding.sourceUrl,
      sourceTitle: finding.sourceTitle,
      query: finding.query || query,
    }));

    for (const source of mapped.emptyPrioritySources) {
      findings.push({
        statement: priorityStatements[source],
        category: "unknown",
        sourceUrl: null,
        sourceTitle: null,
        query: null,
      });
    }

    if (findings.length === 0) {
      findings.push(...unknownFinding("Public research did not return a usable result for this situation."));
    }

    await replaceFindings(preparation.id, findings.slice(0, 12));
    await saveFingerprint(preparation.id, fingerprint);
  } catch {
    logUsage({
      kind: "external_search",
      preparationId: preparation.id,
      reused: false,
      ok: true,
      sources: passages.length,
      detail: "passages_unmapped",
    });
    await replaceFindings(
      preparation.id,
      passages.slice(0, 8).map((passage) => ({
        statement: passage.snippets[0]?.slice(0, 280) || passage.title,
        category: "source_backed",
        sourceUrl: passage.url,
        sourceTitle: passage.title,
        query,
      })),
    );
    await saveFingerprint(preparation.id, fingerprint);
  }
}

async function saveFingerprint(preparationId: string, fingerprint: string) {
  await db
    .update(preparations)
    .set({
      researchInputHash: fingerprint,
      updatedAt: new Date(),
    })
    .where(eq(preparations.id, preparationId));
}
