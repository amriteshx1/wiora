import { z } from "zod";

import { respondJson } from "@/lib/openai-responses";

export const sessionStateSchema = z.object({
  areas: z.array(z.object({
    id: z.string(),
    status: z.enum(["untested", "probing", "weak", "sufficient"]),
    evidence: z.string(),
  })),
  claims: z.array(z.object({
    statement: z.string(),
    support: z.enum(["unsupported", "partial", "supported", "contradicted"]),
  })),
  contradictions: z.array(z.string()),
  uncertainties: z.array(z.string()),
  nextAction: z.enum([
    "dig_deeper",
    "increase_difficulty",
    "challenge",
    "revisit",
    "change_topic",
    "wrap_up",
  ]),
  nextFocusAreaId: z.string().nullable(),
  note: z.string(),
});

export type SessionState = z.infer<typeof sessionStateSchema>;

export function withClock(state: SessionState, minutesRemaining: number): SessionState {
  if (minutesRemaining <= 3) {
    return { ...state, nextAction: "wrap_up" };
  }
  return state;
}

export async function steerSession(input: {
  briefText: string;
  sessionState: unknown;
  turns: { speaker: string; text: string }[];
  minutesRemaining: number;
}): Promise<SessionState> {
  const steered = await respondJson({
    schema: sessionStateSchema,
    name: "session_state",
    input: [
      "Update the session state after the newest turns of one live practice conversation.",
      "A strong answer sets nextAction to increase_difficulty on the same area.",
      "A vague or unsupported answer sets nextAction to challenge.",
      "A contradiction sets nextAction to challenge.",
      "A repeated weakness sets nextAction to revisit.",
      "sufficient means the exit criteria were met, and the next action leaves that area.",
      "Do not open a low-priority area in the last 20 percent of the clock.",
      "Set nextAction to wrap_up when every priority area is sufficient or under three minutes remain.",
      `Minutes remaining: ${input.minutesRemaining}`,
      `Brief:\n${input.briefText}`,
      `Previous session state:\n${JSON.stringify(input.sessionState)}`,
      `New turns:\n${JSON.stringify(input.turns)}`,
    ].join("\n\n"),
  });
  return withClock(steered, input.minutesRemaining);
}
