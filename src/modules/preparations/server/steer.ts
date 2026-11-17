import { z } from "zod";

import { respondJson } from "@/lib/openai-responses";
import { logUsage } from "@/lib/usage-log";

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

export type SteerSituation = {
  counterpartName: string;
  counterpartObjective: string;
  areas: Array<{ id: string; label: string; priority: number; exitCriteria: string }>;
  conversationStyle: {
    depth: string;
    skepticism: string;
    detail: string;
    pace: string;
    interruption: string;
  };
};

export function withClock(state: SessionState, minutesRemaining: number): SessionState {
  if (minutesRemaining <= 3) {
    return { ...state, nextAction: "wrap_up" };
  }
  return state;
}

export async function steerSession(input: {
  situation: SteerSituation;
  sessionState: unknown;
  turns: { speaker: string; text: string }[];
  minutesRemaining: number;
  runId?: string;
}): Promise<SessionState> {
  try {
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
        "Keep note short. Do not rewrite the brief.",
        `Minutes remaining: ${input.minutesRemaining}`,
        `Situation:\n${JSON.stringify(input.situation)}`,
        `Previous session state:\n${JSON.stringify(input.sessionState)}`,
        `New turns:\n${JSON.stringify(input.turns)}`,
      ].join("\n\n"),
    });
    logUsage({ kind: "live_steering", runId: input.runId, ok: true });
    return withClock(steered, input.minutesRemaining);
  } catch (error) {
    logUsage({ kind: "live_steering", runId: input.runId, ok: false });
    throw error;
  }
}
