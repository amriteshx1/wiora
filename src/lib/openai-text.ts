import "server-only";

import OpenAI from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import { zodTextFormat } from "openai/helpers/zod";
import { z, type ZodType } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function textModel(): string {
  const model = process.env.OPENAI_TEXT_MODEL;
  if (!model) {
    throw new Error("OPENAI_TEXT_MODEL is not set");
  }
  return model;
}

export async function respondJson<T extends ZodType>({
  schema,
  input,
  name = "result",
}: {
  schema: T;
  input: string | ResponseInput;
  name?: string;
}): Promise<z.infer<T>> {
  const response = await client.responses.parse({
    model: textModel(),
    store: false,
    input,
    text: {
      format: zodTextFormat(schema, name),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return structured output");
  }

  return response.output_parsed;
}

export async function respondWithWebSearch<T extends ZodType>({
  schema,
  input,
  name = "result",
}: {
  schema: T;
  input: string;
  name?: string;
}): Promise<z.infer<T>> {
  const response = await client.responses.parse({
    model: textModel(),
    store: false,
    input,
    tools: [{ type: "web_search", search_context_size: "low" }],
    tool_choice: "required",
    text: {
      format: zodTextFormat(schema, name),
    },
  });

  if (!response.output_parsed) {
    throw new Error("The model did not return structured output");
  }

  return response.output_parsed;
}
