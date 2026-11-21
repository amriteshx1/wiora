"use client";

import { Reveal } from "@/modules/home/ui/components/landing-ui";

const situations = [
  {
    title: "Job interviews",
    body: "An interviewer who will not leave the project until you name the decision you made. Sit across from that follow-up before Tuesday.",
  },
  {
    title: "Investor pitches",
    body: "A partner who lets the story run for one slide, then asks who paid - and stays there.",
  },
  {
    title: "Sales and client calls",
    body: "A buyer who is friendly about timeline until procurement and legal arrive in the same sentence.",
  },
  {
    title: "Negotiations",
    body: "The other side can turn a concession into a gift while you are still speaking. You hear it live, then you answer.",
  },
  {
    title: "Leadership talks",
    body: "The person who has to carry your words into the next room. Practice the version that survives that meeting.",
  },
  {
    title: "Difficult conversations",
    body: "The conversation you keep delaying. Sit across from them once, then have it for real.",
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
          <p className="text-[15px] leading-relaxed text-[var(--wiora-mute)] md:mt-1.5 md:text-base md:leading-[1.65]">
            The other person will not stay on your list. Follow-ups arrive while
            you are still speaking. Sit in that conversation live, with an AI
            counterpart, before it happens for real.
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
            An AI counterpart for the conversation you have coming.
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
            Written from what was said across the table, not from the brief
            you approved before you joined. Practice a weakness again, or take
            the next run. Each live session uses another interview credit.
          </p>
        </Reveal>

        <div className="grid gap-2.5 md:grid-cols-6 md:grid-rows-3">
          <article className="landing-soft-cool order-3 flex flex-col rounded-[24px] p-5 text-white md:order-none md:col-span-2 md:row-span-2 md:p-6">
            <p className="text-[13px] text-white/55">Moments</p>
            <p className="mt-2 max-w-[40ch] text-[1.1rem] font-normal leading-snug tracking-[-0.03em] md:text-[1.25rem]">
              The follow-up you did not have a number for.
            </p>
            <p className="mt-2 hidden max-w-[46ch] text-sm leading-relaxed text-white/65 md:block">
              The pause after they asked for proof. Open the moment, jump to
              that second in the recording, and hear the turn again.
            </p>
          </article>

          <article className="landing-report order-4 flex min-h-[240px] flex-col justify-between rounded-[24px] p-5 md:order-none md:col-span-2 md:row-span-3 md:min-h-[340px] md:p-7">
            <p className="max-w-[36ch] rounded-[16px] bg-white/12 px-3.5 py-2 text-[13px] leading-snug text-white/85">
              Then why hasn&apos;t anyone else done this?
            </p>
            <div className="mt-8">
              <p className="text-[13px] text-white/55">Report</p>
              <p className="mt-2 max-w-[40ch] text-[1.3rem] font-normal leading-snug tracking-[-0.03em] text-white md:text-[1.5rem]">
                You restated the category when they asked who already paid.
              </p>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-white/65">
                What failed in that turn, why, and what a stronger answer needed.
              </p>
            </div>
          </article>

          <article className="order-1 rounded-[24px] bg-[var(--wiora-mist)] p-4 md:order-none md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Transcript</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Search what was said, line by line.
            </p>
          </article>
          <article className="order-2 rounded-[24px] bg-[var(--wiora-mist)] p-4 md:order-none md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Recording</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Hear the conversation back.
            </p>
          </article>

          <article className="landing-soft-warm order-5 flex flex-col rounded-[24px] p-5 text-white md:order-none md:col-span-2 md:row-span-2 md:p-6">
            <p className="text-[13px] text-white/55">Ask</p>
            <p className="mt-2 max-w-[40ch] text-[1.1rem] font-normal leading-snug tracking-[-0.03em] md:text-[1.25rem]">
              Why that answer failed, asked in your own words.
            </p>
            <p className="mt-2 hidden max-w-[46ch] text-sm leading-relaxed text-white/65 md:block">
              Grounded in this run&apos;s report and the chat that follows - not
              in the brief from before you joined.
            </p>
          </article>

          <article className="order-6 rounded-[24px] bg-[var(--wiora-mist)] p-4 md:order-none md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Practice this again</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Run the weak turn again.
            </p>
          </article>
          <article className="order-7 rounded-[24px] bg-[var(--wiora-mist)] p-4 md:order-none md:col-span-1 md:p-5">
            <p className="text-[16px] font-medium tracking-tight">Next practice</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--wiora-mute)]">
              Same brief, new live session.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
