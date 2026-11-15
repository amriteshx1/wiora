"use client";

import { Reveal } from "@/modules/home/ui/components/landing-ui";

const chapters = [
  { id: "details", label: "Details" },
  { id: "research", label: "Research" },
  { id: "brief", label: "Brief" },
  { id: "interview", label: "Interview" },
  { id: "report", label: "Report" },
] as const;

const researchSteps = [
  { label: "Reading documents", detail: "Pulling facts from the files you added." },
  { label: "Researching", detail: "Looking up the other side in public sources." },
  { label: "Preparing the brief", detail: "Turning what we found into the plan for the room." },
];

const documents = ["Resume.pdf", "Job description", "Deck.pdf"];

export function LandingStages() {
  return (
    <section id="workflow" className="scroll-mt-24">
      <div className="landing-shell flex flex-col gap-10 py-16 md:gap-14 md:py-24">
        <Reveal className="max-w-[38rem]">
          <h2 className="landing-section-title">The whole preparation, not just the call.</h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Research and the brief are free. A live session spends one credit.
            You do not invent a counterpart — the other seat is written from
            the situation you described.
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
                {["Job interview", "Investor pitch", "Sales call", "Negotiation"].map((type, index) => (
                  <span
                    key={type}
                    className={`rounded-full px-3 py-1 text-[12px] ${
                      index === 0
                        ? "bg-[#141414] text-white"
                        : "bg-[var(--wiora-paper)] text-[var(--wiora-mute)]"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="space-y-3 rounded-[16px] bg-[var(--wiora-paper)] p-4">
                <div>
                  <p className="text-[11px] text-[var(--wiora-ash)]">Company</p>
                  <p className="mt-0.5 text-sm">Northline</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--wiora-ash)]">Role</p>
                  <p className="mt-0.5 text-sm">AI Generalist Intern</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[var(--wiora-ash)]">Documents</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {documents.map((file) => (
                    <span
                      key={file}
                      className="rounded-md bg-[var(--wiora-paper)] px-2.5 py-1 text-[12px] text-[var(--wiora-mute)]"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                Describe the situation
              </h3>
              <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                Pick the kind of conversation, add context, and attach the files
                that belong to it. Resume, deck, proposal, contract — whatever
                the other side will have read.
              </p>
            </div>
          </article>

          <article className="landing-research flex min-h-[380px] flex-col justify-between overflow-hidden rounded-[24px] p-6 md:p-8">
            <ol className="space-y-5 pt-2">
              {researchSteps.map((step, index) => (
                <li key={step.label} className="flex gap-3">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                      index === 1 ? "bg-[var(--wiora-ink)]" : "bg-[var(--wiora-ink)]/30"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
                      {step.detail}
                    </p>
                    {index === 1 ? (
                      <div className="mt-2 h-px w-32 overflow-hidden bg-[var(--wiora-rule)]">
                        <div className="research-fill h-px w-full bg-[var(--wiora-ink)]" />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                Research
              </h3>
              <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                Public sources, your documents, then a brief. Nothing is spent
                here. You can still correct facts before a credit is used.
              </p>
            </div>
          </article>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <article className="flex min-h-[360px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[16px] bg-[var(--wiora-paper)] p-4">
                <p className="text-[11px] text-[var(--wiora-ash)]">Known</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[var(--wiora-ink)]">
                  <li>Series A, raising $8M</li>
                  <li>Two enterprise logos in pilot</li>
                  <li>Hiring for the intern role this cycle</li>
                </ul>
              </div>
              <div className="rounded-[16px] bg-[var(--wiora-paper)] p-4">
                <p className="text-[11px] text-[var(--wiora-ash)]">Unknown</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
                  <li>Who else is in the round</li>
                  <li>How they weigh internships vs. projects</li>
                  <li>Whether this interviewer saw the deck</li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                The brief
              </h3>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                Facts, unknowns, and how the conversation will feel. You do not
                pick a difficulty. Correct anything that is wrong, then spend a
                credit.
              </p>
            </div>
          </article>

          <article className="flex min-h-[360px] flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] p-6 md:p-8">
            <div className="space-y-3">
              {[
                { label: "Depth", value: "They will stay on one claim until it has a number." },
                { label: "Skepticism", value: "Friendly until the market story repeats." },
                { label: "Pace", value: "Short turns. They interrupt if you recap." },
              ].map((row) => (
                <div key={row.label} className="rounded-[16px] bg-[var(--wiora-paper)] px-4 py-3">
                  <p className="text-[11px] text-[var(--wiora-ash)]">{row.label}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--wiora-ink)]">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="text-[1.45rem] font-normal tracking-[-0.03em] md:text-[1.7rem]">
                How the room will feel
              </h3>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-[var(--wiora-mute)]">
                Written from the brief, not from a personality you typed in.
                If a fact is wrong, you correct it before you join.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
