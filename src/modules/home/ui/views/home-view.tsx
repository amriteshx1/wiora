"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FeatureMarquee from "../components/Marquee";
import { LandingHero } from "../components/landing-hero";
import { LandingNav } from "../components/landing-nav";
import { LandingPricing } from "../components/landing-pricing";
import { LandingWorkflow } from "../components/landing-workflow";
import { LandingFooter } from "../components/landing-footer";
import {
  LandingAfter,
  LandingProblem,
  LandingSituations,
} from "../components/landing-story";
import {
  Reveal,
  landingPrimaryBtn,
} from "../components/landing-ui";

const faqs = [
  {
    q: "What kinds of professional conversations can I practice on Wiora?",
    a: "Any conversation you can describe in an agent’s instructions: interviews, pitches, client calls, sales, negotiations, or presentations. You write the role. The session is the same.",
  },
  {
    q: "How do I set up the AI agent for the other seat?",
    a: "Create an agent with a name and instructions. Those instructions are what it follows in the live session, so it stays in that role while you speak.",
  },
  {
    q: "How does a live voice practice session actually work?",
    a: "Create a meeting, select the agent, and join from the lobby. Speak out loud. The agent listens and answers in real time from the instructions you wrote.",
  },
  {
    q: "Will the agent ask follow-up questions I did not script?",
    a: "Yes. It responds as the conversation turns, including follow-ups that come from what you just said, not only from a prepared list.",
  },
  {
    q: "What do I receive after a practice session ends?",
    a: "Wiora writes a summary, a searchable transcript, the recording, and Ask AI on that session. The next day, a short follow-up email arrives.",
  },
  {
    q: "Can I try Wiora before choosing a paid plan?",
    a: "Yes. The free plan includes 3 agents and 1 meeting. Paid plans add more minutes, processing, and workspace options.",
  },
];

export const HomeView = () => {
  return (
    <div className="relative flex w-full flex-col">
      <LandingNav />
      <LandingHero />
      <FeatureMarquee />
      <LandingProblem />
      <LandingSituations />
      <LandingWorkflow />
      <LandingAfter />
      <LandingPricing />

      <section>
        <div className="landing-shell flex flex-col gap-10 border-b border-[var(--wiora-rule)] py-16 md:gap-12 md:py-24">
          <Reveal>
            <h2 className="landing-section-title">
              Before you start.
            </h2>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
              A role, a live voice session, and a record you can study.
            </p>
          </Reveal>
          <Accordion type="single" collapsible className="w-full border-t border-[var(--wiora-rule)]">
            {faqs.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-[var(--wiora-rule)]">
                <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[68ch] pb-5 text-sm leading-relaxed text-[var(--wiora-mute)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section>
        <Reveal className="landing-shell flex flex-col items-start gap-5 py-16 md:items-center md:py-24 md:text-center">
          <h2 className="landing-section-title landing-cta-title">
            Practice once, before it counts.
          </h2>
          <p className="max-w-[52ch] text-sm text-[var(--wiora-mute)] md:text-base lg:text-lg">
            Create the agent. Start the session. Hear how you sound while it is
            still practice.
          </p>
          <Button asChild className={`${landingPrimaryBtn} h-11 px-6 lg:text-base text-xs`}>
            <Link href="/sign-up">Get Started for Free</Link>
          </Button>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  );
};
