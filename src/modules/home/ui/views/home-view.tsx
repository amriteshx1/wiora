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
import { Reveal } from "../components/landing-ui";

const faqs = [
  {
    q: "What kinds of conversations can I run on Wiora?",
    a: "A job interview, investor pitch, sales call, negotiation, leadership talk, difficult conversation, performance review, customer escalation, partnership meeting, media interview, salary negotiation, networking conversation, or a custom situation you describe. Each preparation is one of those.",
  },
  {
    q: "Who sits across from me?",
    a: "An AI counterpart for this situation. They play the other person from the brief you approved. You do not pick a difficulty, and you do not invent them by name.",
  },
  {
    q: "What happens during research?",
    a: "Wiora reads the context you gave. A file is optional. If the other side is a public organization, it looks up what is already on the internet, then writes a brief. Submitting research spends one preparation credit. You can still correct facts before you join.",
  },
  {
    q: "How does a live session work?",
    a: "Spend one interview credit and join a live voice session. You speak first. An AI counterpart greets as the other person and stays in the conversation. Follow-ups come from what you just said.",
  },
  {
    q: "Will they ask things I did not write down?",
    a: "Yes. Follow-ups come from what you just said, not only from a prepared list. Spoken turns on their side stay short.",
  },
  {
    q: "What stays after the session ends?",
    a: "A report of what went wrong, why, and what a stronger answer needed - plus moments, transcript, recording, and Ask. Practicing a weakness again, or taking the next run, uses another interview credit.",
  },
  {
    q: "Is there a free live session or a subscription?",
    a: "Every account starts with ten free preparations. There is no free live session and no subscription. Packs are a one-time purchase: Pro is 5 live sessions, Premium is 10, Super is 15 - each with matching extra preparations.",
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
              You give the context. An AI counterpart plays the other person.
              Then you read what was said.
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

      <div className="landing-close">
        <section>
          <Reveal className="landing-shell flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center md:py-20">
            <div className="max-w-[36rem]">
              <h2 className="landing-section-title">Meet the other side.</h2>
              <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-white/65 md:text-base">
                Give the context. Then sit across from an AI counterpart.
              </p>
            </div>
            <Button asChild className="h-10 shrink-0 rounded-full bg-white px-5 text-sm font-medium text-[#141414] shadow-none hover:bg-white/90">
              <Link href="/sign-up">Start a preparation</Link>
            </Button>
          </Reveal>
        </section>

        <LandingFooter />
      </div>
    </div>
  );
};
