import { and, eq, gt } from "drizzle-orm";
import { StreamClient } from "@stream-io/node-sdk";
import type { SessionConfig } from "@stream-io/openai-realtime-api";

import { db } from "@/db";
import { preparations, researchFindings, sessionTurns, simulationRuns } from "@/db/schema";
import { renderBrief, type BriefSituation, type DrillStrategy } from "@/modules/preparations/server/brief";
import { eagerness } from "@/modules/preparations/server/eagerness";
import { steerSession, withClock, type SessionState } from "@/modules/preparations/server/steer";

type Held = { stop: () => void };

const held = new Map<string, Held>();

function streamClient() {
  return new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
    process.env.STREAM_VIDEO_SECRET_KEY!,
  );
}

function asSituation(value: unknown): BriefSituation | null {
  if (!value || typeof value !== "object") return null;
  const model = value as BriefSituation;
  if (!model.conversationStyle || !Array.isArray(model.areas)) return null;
  return {
    ...model,
    patternWeights: Array.isArray(model.patternWeights) ? model.patternWeights : [],
    unknowns: Array.isArray(model.unknowns) ? model.unknowns : [],
    knownFacts: Array.isArray(model.knownFacts) ? model.knownFacts : [],
    counterpartName: model.counterpartName || "Counterpart",
    counterpartObjective: model.counterpartObjective || "",
  };
}

function transcriptOf(event: Record<string, unknown>): string {
  if (typeof event.transcript === "string") return event.transcript.trim();
  const item = event.item;
  if (item && typeof item === "object" && "content" in item && Array.isArray(item.content)) {
    const text = item.content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        if ("transcript" in part && typeof part.transcript === "string") return part.transcript;
        if ("text" in part && typeof part.text === "string") return part.text;
        return "";
      })
      .join(" ")
      .trim();
    if (text) return text;
  }
  return "";
}

function minutesLeft(hardEndAt: Date): number {
  return Math.max(0, (hardEndAt.getTime() - Date.now()) / 60000);
}

async function insertTurn(runId: string, speaker: "user" | "counterpart", text: string) {
  if (!text) return;
  await db.insert(sessionTurns).values({
    runId,
    speaker,
    text,
    startedAt: new Date(),
  }).onConflictDoNothing();
}

export async function startRun(runId: string): Promise<void> {
  if (held.has(runId)) return;

  const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, runId));
  if (!run) {
    console.error("Session was not found");
    return;
  }
  const joinable = run.status === "paid"
    || (run.status === "active" && run.hardEndAt != null && run.hardEndAt.getTime() > Date.now());
  if (!joinable) {
    console.error(`Session ${run.status} cannot be joined`);
    return;
  }

  const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
  const situation = asSituation(preparation?.situationModel);
  if (!situation || !run.briefText) {
    console.error("Session brief is missing");
    return;
  }

  const findings = await db
    .select({ statement: researchFindings.statement, category: researchFindings.category })
    .from(researchFindings)
    .where(eq(researchFindings.preparationId, run.preparationId));

  const client = streamClient();
  const call = client.video.call("default", run.id);
  const realtime = await client.video.connectOpenAi({
    call,
    openAiApiKey: process.env.OPENAI_API_KEY!,
    agentUserId: `cp_${run.id}`,
    model: "gpt-realtime-2.1-mini" as never,
  });

  let stopped = false;
  let responding = false;
  let voiceAccepted = true;
  let forcedWrap = false;
  let ending = false;
  let state = (run.sessionState as SessionState | null) ?? null;
  let hardEndAt = run.hardEndAt;
  let lastAction = state?.nextAction ?? "";
  let lastFocus = state?.nextFocusAreaId ?? "";
  let lastMinute = -1;
  let timer: ReturnType<typeof setInterval> | undefined;
  const pending: { speaker: string; text: string }[] = [];
  const waiters: Array<() => void> = [];

  const stop = () => {
    stopped = true;
    if (timer) clearInterval(timer);
    realtime.disconnect();
    held.delete(runId);
  };
  held.set(runId, { stop });

  const audioConfig = (): SessionConfig => {
    const config: SessionConfig = {
      input_audio_transcription: {
        model: "gpt-4o-mini-transcribe",
        language: "en",
      },
      input_audio_noise_reduction: { type: "near_field" },
      turn_detection: {
        type: "semantic_vad",
        create_response: true,
        interrupt_response: true,
        eagerness: eagerness(situation.conversationStyle),
      } as SessionConfig["turn_detection"],
    };
    if (voiceAccepted) {
      config.voice = "marin";
    }
    return config;
  };

  const publish = (instructions: string) => {
    realtime.updateSession({
      ...audioConfig(),
      instructions,
    });
  };

  const currentInstructions = (minutesRemaining: number) => renderBrief({
    situationModel: situation,
    findings,
    durationMinutes: run.durationMinutes,
    minutesRemaining,
    sessionState: state,
    drillStrategy: (run.drillStrategy as DrillStrategy | null) ?? null,
    nextPracticeFocus: null,
  });

  const pushInstructions = (minutesRemaining: number, force: boolean) => {
    const whole = Math.max(0, Math.ceil(minutesRemaining));
    const action = state?.nextAction ?? "";
    const focus = state?.nextFocusAreaId ?? "";
    if (!force && action === lastAction && focus === lastFocus && whole === lastMinute) return;
    lastAction = action;
    lastFocus = focus;
    lastMinute = whole;
    publish(currentInstructions(whole));
  };

  await realtime.waitForSessionCreated();
  publish(run.briefText);

  realtime.on("realtime.event", (envelope) => {
    const event = (envelope as { event?: Record<string, unknown> }).event;
    if (!event || stopped) return;
    const type = String(event.type ?? "");
    if (type === "response.created") {
      responding = true;
      return;
    }
    if (type === "error" && voiceAccepted) {
      const message = JSON.stringify(event).toLowerCase();
      if (message.includes("marin") || message.includes("voice")) {
        voiceAccepted = false;
        publish(currentInstructions(hardEndAt ? minutesLeft(hardEndAt) : run.durationMinutes));
      }
      return;
    }
    if (type === "conversation.item.input_audio_transcription.completed") {
      const text = transcriptOf(event);
      pending.push({ speaker: "user", text });
      void insertTurn(run.id, "user", text);
      return;
    }
    if (type === "response.output_audio_transcript.done" || type === "response.audio_transcript.done") {
      const text = transcriptOf(event);
      pending.push({ speaker: "counterpart", text });
      void insertTurn(run.id, "counterpart", text);
      return;
    }
    if (type === "response.done") {
      responding = false;
      for (const waiter of waiters.splice(0)) waiter();
      const turns = pending.splice(0);
      if (turns.length === 0 || !hardEndAt) return;
      void (async () => {
        try {
          const next = await steerSession({
            briefText: run.briefText || "",
            sessionState: state,
            turns,
            minutesRemaining: minutesLeft(hardEndAt),
          });
          state = withClock(next, minutesLeft(hardEndAt));
          await db.update(simulationRuns).set({
            sessionState: state,
            updatedAt: new Date(),
          }).where(eq(simulationRuns.id, run.id));
          const changed = state.nextAction !== lastAction || state.nextFocusAreaId !== lastFocus;
          if (changed) pushInstructions(minutesLeft(hardEndAt), true);
        } catch {
          console.error("Steering kept the previous session state");
        }
      })();
    }
  });

  const scripted = process.env.NODE_ENV === "production" ? "" : (process.env.TEST_USER_TURN || "").trim();
  if (scripted) {
    pending.push({ speaker: "user", text: scripted });
    await insertTurn(run.id, "user", scripted);
    if (hardEndAt) {
      try {
        state = withClock(await steerSession({
          briefText: run.briefText || "",
          sessionState: state,
          turns: pending.splice(0),
          minutesRemaining: minutesLeft(hardEndAt),
        }), minutesLeft(hardEndAt));
        await db.update(simulationRuns).set({
          sessionState: state,
          updatedAt: new Date(),
        }).where(eq(simulationRuns.id, run.id));
        pushInstructions(minutesLeft(hardEndAt), true);
      } catch {
        console.error("Steering kept the previous session state");
      }
    }
  }

  timer = setInterval(() => {
    void (async () => {
      if (stopped) return;
      const [current] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, run.id));
      if (!current || (current.status !== "paid" && current.status !== "active")) {
        stop();
        return;
      }
      hardEndAt = current.hardEndAt;
      if (!hardEndAt) return;
      const remaining = minutesLeft(hardEndAt);
      if (remaining <= 3 && !forcedWrap) {
        forcedWrap = true;
        state = withClock(state ?? {
          areas: [],
          claims: [],
          contradictions: [],
          uncertainties: [],
          nextAction: "dig_deeper",
          nextFocusAreaId: null,
          note: "",
        }, remaining);
        pushInstructions(remaining, true);
      } else {
        pushInstructions(remaining, false);
      }
      if (Date.now() >= hardEndAt.getTime()) {
        if (ending) return;
        ending = true;
        const started = Date.now();
        while (responding && Date.now() - started < 30000) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(resolve, 250);
            waiters.push(() => {
              clearTimeout(timeout);
              resolve();
            });
          });
        }
        await call.end().catch(() => undefined);
        stop();
      }
    })().catch(() => {
      console.error("The session clock could not be checked");
    });
  }, 1000);

  realtime.on("close", () => {
    if (!stopped) stop();
  });
}

export async function resumeActiveRuns(): Promise<void> {
  const runs = await db
    .select({ id: simulationRuns.id })
    .from(simulationRuns)
    .where(and(
      eq(simulationRuns.status, "active"),
      gt(simulationRuns.hardEndAt, new Date()),
    ));
  for (const run of runs) {
    await startRun(run.id);
  }
}
