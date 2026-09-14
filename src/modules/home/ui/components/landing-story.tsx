"use client";

import {
  BookOpenTextIcon,
  AudioLinesIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { Reveal } from "@/modules/home/ui/components/landing-ui";
import { cn } from "@/lib/utils";

const situations = [
  {
    title: "Job interviews",
    body: "First rounds, follow-ups, and the question you only hear once you start talking.",
  },
  {
    title: "Investor pitches",
    body: "Tell the story out loud, then sit with the pushback before you are in the room.",
  },
  {
    title: "Client and sales calls",
    body: "Discovery, objections, and the turn where the conversation leaves your notes.",
  },
  {
    title: "Negotiations and reviews",
    body: "Give the agent a counterpart. Hear how your answers land while it is still practice.",
  },
];

const leftovers = [
  {
    title: "Summary",
    icon: BookOpenTextIcon,
    body: "An overview of the session and notes on what was covered.",
  },
  {
    title: "Transcript",
    icon: SearchIcon,
    body: "Search the moment you stalled, hedged, or answered cleanly.",
  },
  {
    title: "Recording",
    icon: AudioLinesIcon,
    body: "Play the session back and hear yourself in the conversation.",
  },
  {
    title: "Ask AI",
    icon: SparklesIcon,
    body: "Chat about that session. It already has the transcript.",
  },
];

function SeatMark() {
  return (
    <svg
      viewBox="0 0 56 24"
      className="mb-5 h-6 w-14 text-[var(--wiora-ink)]"
      aria-hidden
    >
      <rect
        x="1.25"
        y="5.25"
        width="18.5"
        height="13.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="36.25"
        y="5.25"
        width="18.5"
        height="13.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M23 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function LandingProblem() {
  return (
    <section>
      <div className="landing-shell grid items-start gap-10 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-20">
        <Reveal>
          <h2 className="landing-section-title max-w-[16ch]">
            You can script your answers. You cannot script theirs.
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="lg:border-l lg:border-[var(--wiora-rule)] lg:pl-14">
          <SeatMark />
          <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-[1.05rem] md:leading-[1.65]">
            The other person will not stay on your list. Questions, pressure, and
            follow-ups arrive while you are still speaking. Notes cannot simulate
            that. Wiora puts an agent in the other seat for a live voice session,
            so you practice the conversation itself, then end the call when you
            are done.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingSituations() {
  return (
    <section
      id="features"
      className="scroll-mt-24"
    >
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:gap-16">
        <Reveal className="max-w-[40rem]">
          <h2 className="landing-section-title">
            Whatever the conversation, the other seat is ready.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Interviews, pitches, client calls, negotiations. You choose the role.
            The session is the same: speak, respond, review.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2">
          {situations.map((item, index) => (
            <Reveal
              key={item.title}
              delay={index * 0.06}
              className={cn(
                "bg-[var(--wiora-paper)] py-8 sm:px-8 sm:py-10",
                index === 0 && "border-b border-[var(--wiora-rule)] sm:border-r",
                index === 1 && "border-b border-[var(--wiora-rule)]",
                index === 2 && "border-b border-[var(--wiora-rule)] sm:border-b-0 sm:border-r",
              )}
            >
              <p className="text-base font-medium md:text-lg">{item.title}</p>
              <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingAfter() {
  return (
    <section>
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:gap-16">
        <Reveal className="max-w-[42rem]">
          <h2 className="landing-section-title">
            The session ends. The record stays.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            When you hang up, Wiora keeps a summary, a searchable transcript, the
            recording, and Ask AI on that session. The next day, a short follow-up
            arrives by email. Run it again if you want another pass.
          </p>
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {leftovers.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <item.icon
                className="mb-4 size-4 text-[var(--wiora-ink)]"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="text-sm font-medium md:text-base">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wiora-mute)]">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
