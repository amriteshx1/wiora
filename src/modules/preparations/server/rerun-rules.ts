import type { IntakeContext } from "../types";

const watchedFields = ["company", "role", "jobTitle", "investor", "client", "counterparty"] as const;

function normalized(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function researchInputsChanged(
  previousContext: IntakeContext,
  nextContext: IntakeContext,
  previousDocumentIds: string[],
  nextDocumentIds: string[],
): boolean {
  for (const field of watchedFields) {
    if (normalized(previousContext[field]) !== normalized(nextContext[field])) {
      return true;
    }
  }

  const previousIds = [...previousDocumentIds].sort();
  const nextIds = [...nextDocumentIds].sort();
  if (previousIds.length !== nextIds.length) {
    return true;
  }

  return previousIds.some((id, index) => id !== nextIds[index]);
}
