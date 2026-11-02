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
    q: "What kinds of conversations can I run on Wiora?",
    a: "Seven kinds stay: a job interview, an investor pitch, a sales call, a negotiation, a leadership conversation, a difficult conversation, or a custom situation. Each preparation is one of those.",
  },
  {
    q: "How do I define the counterpart?",
    a: "You describe the situation and add the documents. Wiora writes the brief, including how the conversation will feel. You do not pick a difficulty.",
  },
  {
    q: "How does a live session work?",
    a: "After the brief is ready, pay $2, $3, or $4. Join one continuous voice session. The counterpart responds to what you just said until the paid time ends.",
  },
  {
    q: "Will they ask things I did not write down?",
    a: "Yes. The counterpart responds as the conversation turns, including follow-ups that come from what you just said, not only from a prepared list.",
  },
  {
    q: "What stays after the session ends?",
    a: "A report explains what went wrong, why, what was expected, and what a stronger answer needed. You can pay to practice one weakness again, or pay for the next practice. Both are new sessions.",
  },
  {
    q: "Is there a free tier or a subscription?",
    a: "No. Each live session is a one-time payment: $2 for 30 minutes, $3 for 45, or $4 for 60.",
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
              Before the session.
            </h2>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
              A counterpart, a live voice session, and a record of what was said.
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
            Meet the other side.
          </h2>
          <p className="max-w-[52ch] text-sm text-[var(--wiora-mute)] md:text-base lg:text-lg">
            Prepare the situation. Practice it once. Read what to do next.
          </p>
          <Button asChild className={`${landingPrimaryBtn} h-11 px-6 lg:text-base text-xs`}>
            <Link href="/sign-up">Start a preparation</Link>
          </Button>
        </Reveal>
      </section>

      <LandingFooter />
    </div>
  );
};
