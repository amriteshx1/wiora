import type { IntakeContext } from "../types";

const watchedFields = ["company", "role", "jobTitle", "investor", "client", "counterparty", "subject"] as const;

function normalized(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function researchInputFingerprint(
  context: IntakeContext,
  documentIds: string[],
): string {
  const fields = watchedFields.map((field) => `${field}:${normalized(context[field])}`).join("|");
  const documents = [...documentIds].sort().join(",");
  return `${fields}#${documents}`;
}

export function researchInputsChanged(
  previousContext: IntakeContext,
  nextContext: IntakeContext,
  previousDocumentIds: string[],
  nextDocumentIds: string[],
): boolean {
  return researchInputFingerprint(previousContext, previousDocumentIds)
    !== researchInputFingerprint(nextContext, nextDocumentIds);
}

export function shouldSynthesizeOnly(
  storedHash: string | null | undefined,
  fingerprint: string,
): boolean {
  return Boolean(storedHash) && storedHash === fingerprint;
}

export function shouldReuseResearch(
  storedHash: string | null | undefined,
  fingerprint: string,
  findingCount: number,
): boolean {
  return shouldSynthesizeOnly(storedHash, fingerprint) && findingCount > 0;
}
