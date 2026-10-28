import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z, type ZodType } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function respondJson<T extends ZodType>({
  schema,
  input,
  name = "result",
}: {
  schema: T;
  input: string;
  name?: string;
}): Promise<z.infer<T>> {
  const model = process.env.OPENAI_TEXT_MODEL;
  if (!model) {
    throw new Error("OPENAI_TEXT_MODEL is not set");
  }

  const response = await client.responses.parse({
    model,
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
