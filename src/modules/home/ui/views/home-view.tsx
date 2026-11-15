"use client";

import Link from "next/link";
import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LandingHero } from "../components/landing-hero";
import { LandingNav } from "../components/landing-nav";
import { LandingPricing, type LandingPlan } from "../components/landing-pricing";
import { LandingShowcase } from "../components/landing-showcase";
import { LandingStages } from "../components/landing-stages";
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
    a: "A job interview, an investor pitch, a sales call, a negotiation, a leadership conversation, a difficult conversation, or a custom situation. Each preparation is one of those.",
  },
  {
    q: "How is the other side defined?",
    a: "You describe the situation and add the documents. Wiora researches public sources, writes the brief, and sets how the conversation will feel. You do not pick a difficulty, and you do not invent a counterpart by hand.",
  },
  {
    q: "What happens during research?",
    a: "Wiora reads the files you attached, looks up the other side in public sources when that is possible, and synthesizes a brief. Research is free. You can correct facts before you spend a credit.",
  },
  {
    q: "How does a live session work?",
    a: "After the brief is ready, spend one credit. Join one continuous 30-minute voice session. The counterpart responds to what you just said until the time ends.",
  },
  {
    q: "Will they ask things I did not write down?",
    a: "Yes. Follow-ups come from what you just said, not only from a prepared list.",
  },
  {
    q: "What stays after the session ends?",
    a: "A report of what went wrong, why, what was expected, and what a stronger answer needed — plus moments, transcript, recording, and Ask. Practicing a weakness again, or taking the next practice, uses another credit.",
  },
  {
    q: "Is there a free live session or a subscription?",
    a: "Preparation and research are free. There is no free live session and no subscription. Credits are a one-time purchase: PRO is 5 sessions, PLUS is 10, and SUPER is 15.",
  },
];

export const HomeView = ({ plans }: { plans: LandingPlan[] }) => {
  return (
    <div className="relative flex w-full flex-col">
      <LandingNav />
      <LandingHero />
      <LandingShowcase />
      <LandingProblem />
      <LandingStages />
      <LandingSituations />
      <LandingAfter />
      <LandingPricing plans={plans} />

      <section>
        <div className="landing-shell grid items-start gap-10 border-t border-[var(--wiora-rule)] py-16 md:grid-cols-2 md:gap-16 md:py-24">
          <Reveal>
            <h2 className="landing-section-title max-w-[12ch]">Before you start.</h2>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
              The brief, the live session, and the record of what was said.
            </p>
          </Reveal>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-[var(--wiora-rule)]">
                <AccordionTrigger className="group py-5 text-left text-[15px] font-medium hover:no-underline md:text-base [&>svg]:hidden">
                  {item.q}
                  <span className="relative size-4 shrink-0">
                    <PlusIcon className="size-4 text-[var(--wiora-mute)] group-data-[state=open]:hidden" />
                    <MinusIcon className="absolute inset-0 size-4 hidden text-[var(--wiora-mute)] group-data-[state=open]:block" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="max-w-[58ch] pb-5 text-sm leading-relaxed text-[var(--wiora-mute)]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section>
        <div className="border-t border-[var(--wiora-rule)]">
          <Reveal className="landing-shell flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center md:py-20">
            <div className="max-w-[36rem]">
              <h2 className="landing-section-title">Meet the other side.</h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
                Prepare the situation. Practice it once. Read what to do next.
              </p>
            </div>
            <Button asChild className={`${landingPrimaryBtn} h-10 shrink-0 px-5`}>
              <Link href="/sign-up">Start a preparation</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};
