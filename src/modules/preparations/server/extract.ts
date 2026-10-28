import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { preparationDocuments } from "@/db/schema";
import { respondJson } from "@/lib/openai-text";
import { getObjectBytes } from "@/lib/storage";

const markdownSchema = z.object({
  markdown: z.string(),
});

const readingSchema = z.object({
  summary: z.string(),
  claims: z.array(z.string()),
  requirements: z.array(z.string()),
  numbers: z.array(z.string()),
  people: z.array(z.string()),
  passages: z.array(z.object({
    quote: z.string(),
    whyItMatters: z.string(),
  })),
});

const officeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const imageTypes = new Set(["image/png", "image/jpeg"]);

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function officeText(bytes: Uint8Array): Promise<string> {
  const { OfficeParser } = await import("officeparser");
  const ast = await OfficeParser.parseOffice(Buffer.from(bytes));
  const text = await ast.to("text");
  return typeof text === "string" ? text : text.value;
}

async function visibleMarkdown(input: {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
}): Promise<string> {
  const prompt = "Transcribe the visible content of this file as markdown. Do not add facts that are not in the file.";
  const base64 = Buffer.from(input.bytes).toString("base64");

  if (imageTypes.has(input.contentType)) {
    const result = await respondJson({
      schema: markdownSchema,
      name: "visible_markdown",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_url: `data:${input.contentType};base64,${base64}`,
            detail: "auto",
          },
        ],
      }],
    });
    return result.markdown;
  }

  const result = await respondJson({
    schema: markdownSchema,
    name: "visible_markdown",
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        {
          type: "input_file",
          filename: input.fileName,
          file_data: `data:${input.contentType};base64,${base64}`,
        },
      ],
    }],
  });
  return result.markdown;
}

function ensureQuote(
  extractedText: string,
  reading: z.infer<typeof readingSchema>,
): z.infer<typeof readingSchema> {
  const text = extractedText.trim();
  const hasExactQuote = reading.passages.some((passage) =>
    passage.quote.trim().length > 0 && text.includes(passage.quote.trim()),
  );
  if (hasExactQuote || text.length === 0) {
    return reading;
  }

  return {
    ...reading,
    passages: [
      {
        quote: text.slice(0, 180).trim(),
        whyItMatters: "This text comes from the file.",
      },
      ...reading.passages,
    ].slice(0, 6),
  };
}

async function readDocumentText(input: {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
}): Promise<string> {
  if (input.contentType === "text/plain" || input.contentType === "text/markdown") {
    return decodeText(input.bytes);
  }

  if (imageTypes.has(input.contentType)) {
    return visibleMarkdown(input);
  }

  if (!officeTypes.has(input.contentType)) {
    throw new Error("This file type cannot be read");
  }

  const text = await officeText(input.bytes);
  if (text.trim().length < 200) {
    return visibleMarkdown(input);
  }
  return text;
}

export async function extractDocument(documentId: string): Promise<void> {
  const [document] = await db
    .select()
    .from(preparationDocuments)
    .where(eq(preparationDocuments.id, documentId));

  if (!document || document.status !== "ready" || document.reading) {
    return;
  }

  try {
    const bytes = await getObjectBytes(document.objectKey);
    const extractedText = await readDocumentText({
      bytes,
      contentType: document.contentType,
      fileName: document.fileName,
    });
    const reading = await respondJson({
      schema: readingSchema,
      name: "document_reading",
      input: [
        "Read this document for one upcoming conversation.",
        "Return only what the document supports.",
        "Each passage quote must be copied exactly from the document.",
        `File name: ${document.fileName}`,
        extractedText.slice(0, 20000),
      ].join("\n\n"),
    });
    const quoted = ensureQuote(extractedText, reading);

    await db
      .update(preparationDocuments)
      .set({
        extractedText: extractedText.slice(0, 100000),
        reading: quoted,
        status: "ready",
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(preparationDocuments.id, document.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The file could not be read";
    await db
      .update(preparationDocuments)
      .set({
        status: "failed",
        error: message.slice(0, 280),
        updatedAt: new Date(),
      })
      .where(eq(preparationDocuments.id, document.id));
  }
}

export async function extractReadyDocuments(preparationId: string): Promise<void> {
  const documents = await db
    .select()
    .from(preparationDocuments)
    .where(eq(preparationDocuments.preparationId, preparationId));

  for (const document of documents) {
    if (document.status === "ready" && document.reading == null) {
      await extractDocument(document.id);
    }
  }
}
