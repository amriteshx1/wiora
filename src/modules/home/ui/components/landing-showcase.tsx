"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const scenes = [
  {
    id: "pitch",
    label: "Pitch",
    you: "The market is crowded, but we own the workflow.",
    them: "Then why hasn't anyone else done this?",
    youAgain: "They sell a tool. We sit in the room.",
    caption: "Live session",
    body: "The counterpart answers from what you just said — not a script you wrote in advance.",
    reportWrong: "You restated the market when they asked for proof.",
    reportNeed: "One customer. One number. Then stop talking.",
    scores: [
      { label: "Clarity", value: 72 },
      { label: "Proof", value: 38 },
      { label: "Composure", value: 61 },
    ],
  },
  {
    id: "interview",
    label: "Interview",
    you: "I led the launch when the brief was still moving.",
    them: "What did you actually decide, and what did you defer?",
    youAgain: "I froze scope for two weeks and owned the miss if it slipped.",
    caption: "Live session",
    body: "Follow-ups arrive while you are still speaking. That is the part notes cannot rehearse.",
    reportWrong: "You described the launch, not the decision.",
    reportNeed: "Name what you froze, who you told, and what you would own if it slipped.",
    scores: [
      { label: "Clarity", value: 64 },
      { label: "Ownership", value: 81 },
      { label: "Composure", value: 55 },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    you: "Implementation is six weeks if we freeze scope this Friday.",
    them: "And if legal hasn't signed by then?",
    youAgain: "Then we start the technical work and hold go-live, not the kickoff.",
    caption: "Live session",
    body: "Discovery, objections, and the turn that is not on the slide.",
    reportWrong: "You answered a legal delay with a new timeline.",
    reportNeed: "Separate kickoff from go-live. Do not re-trade the whole plan.",
    scores: [
      { label: "Clarity", value: 68 },
      { label: "Scope", value: 44 },
      { label: "Composure", value: 70 },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    you: "We can move on timeline if the scope stays honest.",
    them: "Honest meaning you drop the second phase?",
    youAgain: "No. Honest meaning we price the second phase as optional.",
    caption: "Live session",
    body: "The other seat can turn. You hear it happen, then you answer.",
    reportWrong: "You conceded timeline before the scope was named.",
    reportNeed: "Price the second phase as optional. Do not gift the calendar.",
    scores: [
      { label: "Clarity", value: 58 },
      { label: "Hold", value: 44 },
      { label: "Composure", value: 70 },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    you: "I'm putting the launch back two weeks.",
    them: "The board already heard December.",
    youAgain: "They heard a date. They haven't heard the risk. I'll take that conversation.",
    caption: "Live session",
    body: "The wording has to hold in the room it will actually be said.",
    reportWrong: "You protected the date instead of the risk.",
    reportNeed: "Bring the board the miss, then the new date — in that order.",
    scores: [
      { label: "Clarity", value: 61 },
      { label: "Candor", value: 48 },
      { label: "Composure", value: 74 },
    ],
  },
  {
    id: "difficult",
    label: "Difficult",
    you: "I need to talk about how that meeting landed.",
    them: "You're saying I was out of line?",
    youAgain: "I'm saying the team went quiet. I want to know what you meant to happen.",
    caption: "Live session",
    body: "The conversations you delay. Practice them once before they happen.",
    reportWrong: "You opened with a verdict they had to defend.",
    reportNeed: "Name the effect on the team. Ask what they meant. Then stop.",
    scores: [
      { label: "Clarity", value: 66 },
      { label: "Care", value: 42 },
      { label: "Composure", value: 58 },
    ],
  },
] as const;

function Bubble({
  side,
  children,
}: {
  side: "you" | "them";
  children: string;
}) {
  const yours = side === "you";
  return (
    <div className={cn("flex", yours ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-[18px] px-3.5 py-2 text-[13px] leading-snug md:text-sm",
          yours
            ? "bg-white/18 text-white/95"
            : "bg-white text-[#1a1a1a] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.45)]",
        )}
      >
        {children}
      </p>
    </div>
  );
}

export function LandingShowcase() {
  const [active, setActive] = useState<(typeof scenes)[number]["id"]>("pitch");
  const scene = scenes.find((item) => item.id === active) ?? scenes[0];

  return (
    <section id="product" className="scroll-mt-24">
      <div className="landing-shell pb-16 md:pb-20">
        <div className="mb-5 flex justify-center overflow-x-auto">
          <div className="flex min-w-max items-end gap-1 border-b border-[var(--wiora-rule)]">
            {scenes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  "relative px-3.5 py-2.5 text-[13px] transition-colors md:px-4 md:text-sm",
                  item.id === active
                    ? "text-[var(--wiora-ink)] after:absolute after:inset-x-3 after:bottom-[-1px] after:h-px after:bg-[var(--wiora-ink)]"
                    : "text-[var(--wiora-ash)] hover:text-[var(--wiora-mute)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <article className="landing-room relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[24px] p-6 md:min-h-[500px] md:p-8">
            <div className="flex flex-col gap-3 pt-8 md:pt-12">
              <Bubble side="you">{scene.you}</Bubble>
              <Bubble side="them">{scene.them}</Bubble>
              <Bubble side="you">{scene.youAgain}</Bubble>
            </div>
            <div className="mt-10 max-w-[36rem]">
              <h3 className="text-[1.65rem] font-normal leading-tight tracking-[-0.03em] text-white md:text-[2rem]">
                {scene.caption}
              </h3>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/70">
                {scene.body}
              </p>
            </div>
          </article>

          <article className="flex min-h-[420px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:min-h-[500px] md:p-8">
            <div className="rounded-[20px] bg-[var(--wiora-paper)] p-4 landing-whisper md:p-5">
              <p className="text-[13px] text-[var(--wiora-ash)]">Report</p>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--wiora-ink)]">
                {scene.reportWrong}
              </p>
              <div className="mt-3.5 h-px bg-[var(--wiora-rule)]" />
              <p className="mt-3.5 text-[13px] text-[var(--wiora-ash)]">What a stronger answer needed</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--wiora-mute)]">
                {scene.reportNeed}
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {scene.scores.map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-[12px] text-[var(--wiora-mute)]">
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[var(--wiora-rule)]">
                      <div
                        className="h-full rounded-full bg-[#141414]/70"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-7 max-w-[36rem]">
              <h3 className="text-[1.65rem] font-normal leading-tight tracking-[-0.03em] md:text-[2rem]">
                The record
              </h3>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                After you hang up: what went wrong, why, and what to practice
                next. Transcript, recording, moments, and Ask sit beside it.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
