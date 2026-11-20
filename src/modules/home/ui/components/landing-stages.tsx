"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/modules/home/ui/components/landing-ui";

const chapters = [
  { id: "details", label: "Details" },
  { id: "research", label: "Research" },
  { id: "brief", label: "Brief" },
  { id: "interview", label: "Interview" },
  { id: "report", label: "Report" },
] as const;

const researchSteps = [
  { label: "Reading what you gave", detail: "The context you wrote, and a file only if you added one." },
  { label: "Public research", detail: "News, filings, interviews, and company pages already on the internet." },
  { label: "Writing the brief", detail: "Known, unknown, and how they will sit." },
];

const situations = [
  {
    id: "job",
    label: "Job interview",
    fields: [
      { k: "Company", v: "Northline" },
      { k: "Role", v: "AI Generalist Intern" },
    ],
    documents: ["Resume.pdf", "Job description", "Deck.pdf"],
    known: [
      "Series A, raising $8M this cycle",
      "Two enterprise logos in a paid pilot",
      "This intern role is open on their careers page",
    ],
    unknown: [
      "Who else is in the intern round",
      "Whether they weigh projects over internships",
      "Whether this interviewer saw your deck",
    ],
    room: [
      { beat: "Opens", value: "Warm. They give you the floor: walk them through a project you owned. They let you pick." },
      { beat: "Then", value: "They lock onto one decision in that project. Who it hit. What you would own if it failed. They will not change the subject." },
      { beat: "If you recap", value: "They cut the recap. They ask the same question quieter. They want the call you made, not the loop you sat in." },
    ],
  },
  {
    id: "pitch",
    label: "Investor pitch",
    fields: [
      { k: "Fund", v: "Halden Capital" },
      { k: "Round", v: "Series A · $8M" },
    ],
    documents: ["Deck.pdf", "Metrics.csv", "Data room"],
    known: [
      "Thesis is B2B workflow, not another copilot",
      "They led two similar rounds last year",
      "Public interview: they want proof over story",
    ],
    unknown: [
      "Who else is in this round",
      "Whether they already passed once",
      "How they treat intern-heavy founding teams",
    ],
    room: [
      { beat: "Opens", value: "They let the story run for one slide. They nod. They do not interrupt yet." },
      { beat: "Then", value: "Who already paid? They stay on that number. Market and category get no air." },
      { beat: "If you recap", value: "They talk over you. They want a customer, a figure, then silence - so you have to fill it." },
    ],
  },
  {
    id: "sales",
    label: "Sales call",
    fields: [
      { k: "Client", v: "Northline Ops" },
      { k: "Product", v: "Live practice for enablement" },
    ],
    documents: ["Proposal.pdf", "Pricing", "Case study"],
    known: [
      "Legal is already on the thread",
      "They asked for a six-week live date",
      "They take notes in a competitor today",
    ],
    unknown: [
      "Who actually owns budget",
      "How long procurement sits on a redline",
      "Whether the champion can sign",
    ],
    room: [
      { beat: "Opens", value: "Friendly. Timeline first. They talk as if the deal is already happening." },
      { beat: "Then", value: "Procurement and legal arrive in one sentence. The six-week date is now a question, not a plan." },
      { beat: "If you re-trade", value: "They take the concession. The date does not come back. They wait to see if you notice." },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    fields: [
      { k: "Counterparty", v: "Northline Legal" },
      { k: "Subject", v: "Phase-two fee" },
    ],
    documents: ["Contract.pdf", "Redlines", "Term sheet"],
    known: [
      "They want a Friday start",
      "Second phase was inside the first quote",
      "Their budget for this year is frozen",
    ],
    unknown: [
      "Their walk-away number",
      "Who can approve an optional phase",
      "Whether the Friday date is real leverage",
    ],
    room: [
      { beat: "Opens", value: "They agree the start date is movable. They sound like the reasonable one in the room." },
      { beat: "Then", value: "They fold phase two into this fee as if it were already implied. Priced, or optional - they make you say it." },
      { beat: "If you gift the date", value: "They take it. The option is still unpaid. The room does not remind you." },
    ],
  },
] as const;

export function LandingStages() {
  const [active, setActive] = useState<(typeof situations)[number]["id"]>("job");
  const situation = situations.find((item) => item.id === active) ?? situations[0];

  return (
    <section id="workflow" className="scroll-mt-24">
      <div className="landing-shell flex flex-col gap-10 py-16 md:gap-14 md:py-24">
        <Reveal className="max-w-[38rem]">
          <h2 className="landing-section-title">From the situation to the room.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Every account starts with ten free preparations. Describe the
            conversation. Wiora writes a brief you can correct. A live session
            with an AI counterpart spends a separate interview credit.
          </p>
        </Reveal>

        <ol className="flex w-full items-center overflow-x-auto pb-1 text-sm">
          {chapters.map((chapter, index) => {
            const last = index === chapters.length - 1;
            return (
              <li key={chapter.id} className={`flex min-w-0 items-center ${last ? "" : "flex-1"}`}>
                <span className="shrink-0 text-[var(--wiora-ink)]">{chapter.label}</span>
                {last ? null : <span className="mx-3 h-px min-w-6 flex-1 bg-[var(--wiora-rule)] md:mx-4" />}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-3 md:grid-cols-2">
          <article className="flex min-h-[380px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {situations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(item.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] transition-colors",
                      item.id === active
                        ? "bg-[#141414] text-white"
                        : "bg-[var(--wiora-paper)] text-[var(--wiora-mute)] hover:text-[var(--wiora-ink)]",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <dl className="space-y-3 rounded-[16px] bg-[var(--wiora-paper)] p-4">
                {situation.fields.map((field) => (
                  <div key={field.k} className="flex items-baseline gap-3">
                    <dt className="w-[7.5rem] shrink-0 text-[11px] text-[var(--wiora-ash)]">
                      {field.k}
                    </dt>
                    <dd className="text-sm text-[var(--wiora-ink)]">{field.v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <p className="text-[11px] text-[var(--wiora-ash)]">Attached</p>
                <ul className="mt-2 space-y-1">
                  {situation.documents.map((file) => (
                    <li
                      key={file}
                      className="flex items-center gap-2 text-[13px] text-[var(--wiora-mute)]"
                    >
                      <span className="size-1 shrink-0 rounded-full bg-[var(--wiora-ash)]" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                Describe the situation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wiora-mute)]">
                Pick the type and give the context: who you are meeting, what
                it is about, and what you want. A resume, deck, or contract is
                optional. Saving a draft spends nothing.
              </p>
            </div>
          </article>

          <article className="landing-research flex min-h-[380px] flex-col justify-between overflow-hidden rounded-[24px] p-6 md:p-8">
            <ol className="space-y-5 pt-2">
              {researchSteps.map((step, index) => (
                <li key={step.label} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                      index === 1 ? "bg-white" : "bg-white/30"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{step.label}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">
                      {step.detail}
                    </p>
                    {index === 1 ? (
                      <div className="mt-2 h-px w-64 overflow-hidden bg-white/20">
                        <div className="research-fill h-px w-full bg-white" />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] text-white md:text-[1.7rem]">
                Research
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                What you described, then what is already public if it would
                help. One preparation credit starts this. You can still
                correct the brief before you join.
              </p>
            </div>
          </article>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <article className="flex min-h-[360px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:p-8">
            <div className="rounded-[20px] bg-[var(--wiora-paper)] p-4 landing-whisper md:p-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[12px] text-[var(--wiora-ash)]">Found</p>
                  <ul className="mt-3 space-y-3">
                    {situation.known.map((item) => (
                      <li
                        key={item}
                        className="border-l-2 border-[var(--wiora-ink)] pl-3 text-[13px] leading-relaxed text-[var(--wiora-ink)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[12px] text-[var(--wiora-ash)]">Still open</p>
                  <ul className="mt-3 space-y-3">
                    {situation.unknown.map((item) => (
                      <li
                        key={item}
                        className="border-l-2 border-dashed border-[var(--wiora-ash)] pl-3 text-[13px] leading-relaxed text-[var(--wiora-mute)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                The brief
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wiora-mute)]">
                Read it. Add or remove anything that is wrong. You do not pick
                a difficulty. When it is right, that is who the AI counterpart
                will play.
              </p>
            </div>
          </article>

          <article className="flex min-h-[360px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:p-8">
            <div className="rounded-[20px] bg-[var(--wiora-paper)] p-4 landing-whisper md:p-5">
              <ol className="relative space-y-0">
                {situation.room.map((row, index) => (
                  <li key={row.beat} className="relative grid grid-cols-[4.5rem_1fr] gap-4 pb-5 last:pb-0">
                    {index < situation.room.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute bottom-0 left-[1.15rem] top-5 w-px bg-[var(--wiora-rule)]"
                      />
                    ) : null}
                    <p className="pt-0.5 text-[12px] text-[var(--wiora-ash)]">{row.beat}</p>
                    <p className="text-[13px] leading-relaxed text-[var(--wiora-ink)]">{row.value}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                How the room will feel
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wiora-mute)]">
                An AI counterpart greets in role and stays as that person. How
                they open, where they press, what they do if you stall.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
