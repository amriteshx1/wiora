"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const scenes = [
  {
    id: "pitch",
    label: "Pitch",
    you: "We close in the room. The workflow is the product.",
    them: "Then why hasn't anyone else done this?",
    youAgain: "They log the call after. We sit in it before it happens.",
    caption: "The investor",
    body: "They sit in that seat. They greet in role. They answer from the claim you just made - not from a script you typed last night.",
    reportWrong: "You restated the category when they asked who already paid.",
    reportNeed: "One customer. One number. Then stop talking.",
    scores: [
      { label: "Traction", value: 38 },
      { label: "Market", value: 71 },
      { label: "Defensibility", value: 54 },
    ],
  },
  {
    id: "interview",
    label: "Interview",
    you: "I ran the intern loop when the team was still two people.",
    them: "What did you actually decide without your manager?",
    youAgain: "I cut the take-home from five hours to one. Two people dropped. I owned that.",
    caption: "The interviewer",
    body: "They sit across the table. The follow-up is about the decision, not the job post. Notes cannot rehearse that turn.",
    reportWrong: "You described the loop instead of the call you made.",
    reportNeed: "Name the decision, who it hit, and what you would own if it failed.",
    scores: [
      { label: "Project depth", value: 74 },
      { label: "Resume credibility", value: 41 },
      { label: "Communication", value: 63 },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    you: "We can be live in six weeks if legal signs Friday.",
    them: "Procurement hasn't seen a redline. What if they don't?",
    youAgain: "Kickoff still happens. Go-live waits on the paper - not the other way around.",
    caption: "The buyer",
    body: "They stay in the deal. The objection is not on the slide. It arrives while you are still selling the timeline.",
    reportWrong: "You answered a legal delay by rewriting the whole plan.",
    reportNeed: "Keep kickoff. Hold go-live. Do not re-trade scope to soothe procurement.",
    scores: [
      { label: "Discovery", value: 66 },
      { label: "Objection handling", value: 39 },
      { label: "Closing", value: 58 },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    you: "We can move the start date if the second phase stays priced.",
    them: "Priced, or optional? Those are different.",
    youAgain: "Optional. You can decline it. You cannot fold it into this fee.",
    caption: "The other side",
    body: "They can turn a concession into a gift while you are still speaking. You hear it live, then you answer.",
    reportWrong: "You moved the calendar before the second phase had a price.",
    reportNeed: "Price the option. Do not donate the date to close the room.",
    scores: [
      { label: "Leverage", value: 44 },
      { label: "Concessions", value: 51 },
      { label: "Outcome", value: 62 },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    you: "I'm moving the launch two weeks. The board already heard December.",
    them: "So I tell them we missed?",
    youAgain: "You tell them the risk first. I'll take the date.",
    caption: "The next room",
    body: "They are the person who has to carry your words. The wording has to hold here - not in the notes you wrote after.",
    reportWrong: "You protected the date instead of naming the risk.",
    reportNeed: "Bring the miss, then the new date. In that order.",
    scores: [
      { label: "Issue clarity", value: 61 },
      { label: "Candor", value: 46 },
      { label: "What you asked", value: 72 },
    ],
  },
  {
    id: "difficult",
    label: "Difficult",
    you: "I need to talk about how Tuesday's meeting landed.",
    them: "You're saying I was the problem.",
    youAgain: "The team went quiet after you spoke. I want to know what you meant to happen.",
    caption: "The other person",
    body: "The conversation you keep delaying. Sit across from them once, then have it for real.",
    reportWrong: "You opened with a verdict they had to defend.",
    reportNeed: "Name the effect on the team. Ask what they meant. Then stop.",
    scores: [
      { label: "What happened", value: 64 },
      { label: "Stayed specific", value: 37 },
      { label: "Desired outcome", value: 55 },
    ],
  },
] as const;

function verdictFor(value: number) {
  if (value < 45) return "thin";
  if (value < 65) return "mixed";
  return "held";
}

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
            {scenes.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  "relative px-3.5 py-2.5 text-[13px] transition-colors md:px-4 md:text-sm",
                  index >= 4 && "hidden md:block",
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
              <p className="w-full text-[13px] leading-snug text-[var(--wiora-mute)]">
                “{scene.them}”
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[12px] text-[var(--wiora-ash)]">This turn</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--wiora-ink)]">
                    {scene.reportWrong}
                  </p>
                </div>
                <div className="border-[var(--wiora-rule)] sm:border-l sm:pl-4">
                  <p className="text-[12px] text-[var(--wiora-ash)]">Needed</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--wiora-ink)]">
                    {scene.reportNeed}
                  </p>
                </div>
              </div>
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-[var(--wiora-rule)] pt-4">
                {scene.scores.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-baseline gap-2 text-[13px]"
                  >
                    <span className="shrink-0 text-[var(--wiora-mute)]">{row.label}</span>
                    <span
                      aria-hidden
                      className="h-[7px] min-w-8 flex-1 self-center"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M0 6 L2.5 1 L5 6 L7.5 1 L10 6' fill='none' stroke='%239a958c' stroke-width='1'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "repeat-x",
                        backgroundPosition: "center",
                      }}
                    />
                    <span className="shrink-0 text-[var(--wiora-ink)]">
                      {verdictFor(row.value)}
                    </span>
                  </li>
                ))}
              </ul>
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
