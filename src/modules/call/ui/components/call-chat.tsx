"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type Speaker = "user" | "counterpart";

type Placeholder = {
  id: string;
  speaker: Speaker;
  speaking: boolean;
  stoppedAt: number | null;
};

type Turn = {
  speaker: Speaker;
  name: string;
  text: string;
  startTs: number;
};

type Item =
  | { kind: "turn"; key: string; speaker: Speaker; name: string; text: string }
  | { kind: "placeholder"; key: string; speaker: Speaker; speaking: boolean };

interface Props {
  runId: string;
  userSpeaking: boolean;
  counterpartSpeaking: boolean;
  userName: string;
  counterpartName: string;
}

const DROP_AFTER_MS = 4000;

function turnKey(turn: Turn) {
  return `${turn.speaker}:${turn.startTs}:${turn.text}`;
}

function speakerOf(
  item: { speaker?: string; name: string },
  userName: string,
): Speaker {
  if (item.speaker === "user" || item.speaker === "counterpart") return item.speaker;
  return item.name === userName ? "user" : "counterpart";
}

export function CallChat({
  runId,
  userSpeaking,
  counterpartSpeaking,
  userName,
  counterpartName,
}: Props) {
  const trpc = useTRPC();
  const scroller = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  const [turns, setTurns] = useState<Turn[]>([]);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const hydrated = useRef(false);

  const transcript = useQuery({
    ...trpc.runs.getTranscript.queryOptions({ runId }),
    refetchInterval: 1500,
  });

  useEffect(() => {
    const incoming = (transcript.data ?? []).map((item) => {
      const speaker = speakerOf(item, userName);
      return {
        speaker,
        name: item.name,
        text: item.text,
        startTs: item.startTs,
      } satisfies Turn;
    });
    if (!hydrated.current) {
      if (transcript.data === undefined) return;
      incoming.forEach((turn) => seen.current.add(turnKey(turn)));
      setTurns(incoming);
      hydrated.current = true;
      return;
    }
    const fresh = incoming.filter((turn) => {
      const key = turnKey(turn);
      if (seen.current.has(key)) return false;
      seen.current.add(key);
      return true;
    });
    if (fresh.length === 0) return;

    setTurns((current) => [...current, ...fresh]);
    setPlaceholders((current) => {
      const next = [...current];
      for (const turn of fresh) {
        const index = next.findIndex((item) => item.speaker === turn.speaker);
        if (index >= 0) next.splice(index, 1);
      }
      return next;
    });
  }, [transcript.data, userName]);

  useEffect(() => {
    setPlaceholders((current) => {
      const index = current.findIndex((item) => item.speaker === "user");
      if (userSpeaking) {
        if (index >= 0) {
          return current.map((item, i) =>
            i === index ? { ...item, speaking: true, stoppedAt: null } : item,
          );
        }
        return [
          ...current,
          { id: `user-${Date.now()}`, speaker: "user", speaking: true, stoppedAt: null },
        ];
      }
      if (index < 0) return current;
      if (!current[index].speaking) return current;
      return current.map((item, i) =>
        i === index ? { ...item, speaking: false, stoppedAt: Date.now() } : item,
      );
    });
  }, [userSpeaking]);

  useEffect(() => {
    setPlaceholders((current) => {
      const index = current.findIndex((item) => item.speaker === "counterpart");
      if (counterpartSpeaking) {
        if (index >= 0) {
          return current.map((item, i) =>
            i === index ? { ...item, speaking: true, stoppedAt: null } : item,
          );
        }
        return [
          ...current,
          { id: `counterpart-${Date.now()}`, speaker: "counterpart", speaking: true, stoppedAt: null },
        ];
      }
      if (index < 0) return current;
      if (!current[index].speaking) return current;
      return current.map((item, i) =>
        i === index ? { ...item, speaking: false, stoppedAt: Date.now() } : item,
      );
    });
  }, [counterpartSpeaking]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPlaceholders((current) =>
        current.filter((item) => {
          if (item.speaking) return true;
          if (item.stoppedAt == null) return true;
          return now - item.stoppedAt < DROP_AFTER_MS;
        }),
      );
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const items = useMemo<Item[]>(() => {
    const list: Item[] = turns.map((turn) => ({
      kind: "turn",
      key: turnKey(turn),
      speaker: turn.speaker,
      name: turn.name,
      text: turn.text,
    }));
    for (const placeholder of placeholders) {
      list.push({
        kind: "placeholder",
        key: placeholder.id,
        speaker: placeholder.speaker,
        speaking: placeholder.speaking,
      });
    }
    return list;
  }, [placeholders, turns]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [items.length]);

  const waitingForCounterpart = placeholders.some(
    (item) => item.speaker === "counterpart" && !item.speaking,
  );

  return (
    <div className="relative mx-auto flex h-[min(48vh,24rem)] w-full max-w-xl min-h-0 flex-col self-center overflow-hidden">
      <div
        ref={scroller}
        className={cn(
          "call-transcript min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          items.length === 0 ? "flex items-center justify-center" : "space-y-5",
        )}
      >
        {items.length === 0 ? (
          <div className="px-4 text-center">
            <p className="text-base text-white/45">Your conversation will appear here.</p>
            <p className="mt-px text-sm italic text-white/45">
              Speak naturally. Your conversation will unfold here in real time.
            </p>
          </div>
        ) : null}
        {items.map((item) => {
          const own = item.speaker === "user";
          const name = item.speaker === "user" ? userName : counterpartName;
          return (
            <div key={item.key} className={cn("flex", own ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[88%] px-1 py-1", own ? "text-right" : "text-left")}>
                <p className="text-[11px] tracking-wide text-white/45">
                  {name}
                </p>
                {item.kind === "turn" ? (
                  <p className="mt-1.5 break-words text-[15px] leading-relaxed text-[#f5f5f4]">{item.text}</p>
                ) : (
                  <span className="mt-3 flex gap-1" aria-label="Speaking">
                    <span className="call-bubble-dot size-1.5 rounded-full bg-white/80" />
                    <span className="call-bubble-dot size-1.5 rounded-full bg-white/80 [animation-delay:140ms]" />
                    <span className="call-bubble-dot size-1.5 rounded-full bg-white/80 [animation-delay:280ms]" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        {waitingForCounterpart ? "Waiting for the line" : ""}
      </span>
    </div>
  );
}
