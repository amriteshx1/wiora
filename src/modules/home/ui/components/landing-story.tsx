"use client";

import { Reveal } from "@/modules/home/ui/components/landing-ui";

const situations = [
  {
    title: "Job interviews",
    body: "The question that only appears once you are talking — not the one on the job post.",
  },
  {
    title: "Investor pitches",
    body: "Tell the story out loud, then sit with the pushback in the same thirty minutes.",
  },
  {
    title: "Sales and client calls",
    body: "Discovery, objections, and the turn where the conversation leaves your notes.",
  },
  {
    title: "Negotiations",
    body: "A counterpart in the other seat, and a conversation that can change while you are still in it.",
  },
  {
    title: "Leadership talks",
    body: "Reviews, board updates, and the rooms where the wording has to hold.",
  },
  {
    title: "Difficult conversations",
    body: "The ones you delay. Practice them once before they happen for real.",
  },
];

export function LandingProblem() {
  return (
    <section>
      <div className="landing-shell grid items-start gap-8 py-10 md:py-14 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h2 className="landing-section-title max-w-[16ch]">
            You can script your answers. You cannot script theirs.
          </h2>
        </Reveal>
        <Reveal delay={0.04}>
          <p className="max-w-[50ch] text-[15px] leading-relaxed text-[var(--wiora-mute)] md:mt-1.5 md:text-base md:leading-[1.65]">
            The other person will not stay on your list. Follow-ups arrive while
            you are still speaking. Wiora researches the situation, writes a
            brief you can correct, then runs one live session and writes the
            report when you hang up.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function SituationCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[24px] bg-[var(--wiora-mist)] px-6 py-6">
      <h3 className="text-[17px] font-medium tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--wiora-mute)]">{body}</p>
    </article>
  );
}

export function LandingSituations() {
  const [featured, pitch, sales, ...rest] = situations;

  return (
    <section id="features" className="scroll-mt-24">
      <div className="landing-shell flex flex-col gap-8 py-16 md:gap-10 md:py-24">
        <Reveal className="max-w-[36rem]">
          <h2 className="landing-section-title">
            Whatever the conversation, the other seat is ready.
          </h2>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="landing-ember relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-[24px] p-6 md:col-span-2 md:row-span-2 md:min-h-[320px] md:p-8">
            <h3 className="text-[1.65rem] font-normal tracking-[-0.03em] text-white md:text-[2rem]">
              {featured.title}
            </h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/70">
              {featured.body}
            </p>
          </article>
          <SituationCard title={pitch.title} body={pitch.body} />
          <SituationCard title={sales.title} body={sales.body} />
          {rest.map((item) => (
            <SituationCard key={item.title} title={item.title} body={item.body} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingAfter() {
  return (
    <section>
      <div className="landing-shell flex flex-col gap-8 py-16 md:gap-10 md:py-24">
        <Reveal className="max-w-[38rem]">
          <h2 className="landing-section-title">The session ends. The record stays.</h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Written from what was said, not from the brief research. Practice a
            weakness again, or take the next run. Each live session uses another
            credit.
          </p>
        </Reveal>

        <div className="grid gap-2.5 md:grid-cols-6 md:grid-rows-3">
          <article className="landing-soft-cool flex flex-col rounded-[24px] p-5 text-white md:col-span-2 md:row-span-2 md:p-6">
            <p className="text-[13px] text-white/55">Moments</p>
            <p className="mt-2 max-w-[40ch] text-[1.1rem] font-normal leading-snug tracking-[-0.03em] md:text-[1.25rem]">
              The follow-up you did not have a number for.
            </p>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/65">
              The pause after they asked for proof. Open the moment, jump into
              the transcript, and hear the turn again.
            </p>
          </article>

          <article className="landing-report flex min-h-[240px] flex-col justify-between rounded-[24px] p-5 md:col-span-2 md:row-span-3 md:min-h-[340px] md:p-7">
            <p className="max-w-[36ch] rounded-[16px] bg-white/12 px-3.5 py-2 text-[13px] leading-snug text-white/85">
              Then why hasn&apos;t anyone else done this?
            </p>
            <div className="mt-8">
              <p className="text-[13px] text-white/55">Report</p>
              <p className="mt-2 max-w-[40ch] text-[1.3rem] font-normal leading-snug tracking-[-0.03em] text-white md:text-[1.5rem]">
                You restated the market when they asked for proof.
              </p>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/65">
                What went wrong, why, and what a stronger answer needed.
              </p>
            </div>
          </article>

          <article className="rounded-[24px] bg-[var(--wiora-mist)] p-4 md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Transcript</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Search the session, line by line.
            </p>
          </article>
          <article className="rounded-[24px] bg-[var(--wiora-mist)] p-4 md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Recording</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Play the session back.
            </p>
          </article>

          <article className="landing-soft-warm flex flex-col rounded-[24px] p-5 text-white md:col-span-2 md:row-span-2 md:p-6">
            <p className="text-[13px] text-white/55">Ask</p>
            <p className="mt-2 max-w-[40ch] text-[1.1rem] font-normal leading-snug tracking-[-0.03em] md:text-[1.25rem]">
              What a stronger answer needed, asked in your own words.
            </p>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/65">
              Grounded in the summary and the chat that follows — not in the
              brief from before you joined.
            </p>
          </article>

          <article className="rounded-[24px] bg-[var(--wiora-mist)] p-4 md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Practice this again</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Run the weakness for 30 minutes.
            </p>
          </article>
          <article className="rounded-[24px] bg-[var(--wiora-mist)] p-4 md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Next practice</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Same preparation, new run.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
