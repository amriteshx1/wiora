import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { preparations } from "@/db/schema";

import { extractReadyDocuments } from "./extract";
import { researchPreparation } from "./research";
import { synthesizePreparation } from "./synthesize";

async function loadPreparation(preparationId: string) {
  const [preparation] = await db
    .select()
    .from(preparations)
    .where(eq(preparations.id, preparationId));
  return preparation ?? null;
}

async function markStep(preparationId: string, situationVersion: number, processingStep: string) {
  await db
    .update(preparations)
    .set({
      processingStep,
      updatedAt: new Date(),
    })
    .where(and(
      eq(preparations.id, preparationId),
      eq(preparations.situationVersion, situationVersion),
      eq(preparations.status, "processing"),
    ));
}

export async function processPreparation(input: {
  preparationId: string;
  situationVersion: number;
  synthesizeOnly?: boolean;
}): Promise<void> {
  const preparation = await loadPreparation(input.preparationId);
  if (!preparation) {
    return;
  }
  if (preparation.situationVersion !== input.situationVersion) {
    return;
  }
  if (preparation.status !== "processing") {
    return;
  }

  try {
    if (!input.synthesizeOnly) {
      await markStep(preparation.id, preparation.situationVersion, "extracting");
      await extractReadyDocuments(preparation.id);
      await markStep(preparation.id, preparation.situationVersion, "researching");
      await researchPreparation(preparation.id);
    }

    await markStep(preparation.id, preparation.situationVersion, "synthesizing");
    const situationModel = await synthesizePreparation(preparation.id);

    await db
      .update(preparations)
      .set({
        situationModel,
        status: "ready",
        processingStep: null,
        error: null,
        situationVersion: preparation.situationVersion + 1,
        updatedAt: new Date(),
      })
      .where(and(
        eq(preparations.id, preparation.id),
        eq(preparations.situationVersion, preparation.situationVersion),
        eq(preparations.status, "processing"),
      ));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief could not be prepared";
    await db
      .update(preparations)
      .set({
        status: "failed",
        processingStep: null,
        error: message.slice(0, 280),
        updatedAt: new Date(),
      })
      .where(and(
        eq(preparations.id, preparation.id),
        eq(preparations.situationVersion, preparation.situationVersion),
        eq(preparations.status, "processing"),
      ));
  }
}
