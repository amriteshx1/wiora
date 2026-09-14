"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DemoAgentForm,
  DemoMeetingForm,
} from "@/modules/home/ui/components/landing-demos";
import {
  ProductFrame,
  landingGhostBtn,
  landingPrimaryBtn,
  scrollToId,
} from "@/modules/home/ui/components/landing-ui";

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section id="about" className="scroll-mt-24">
      <div className="landing-shell grid items-start gap-10 border-b border-[var(--wiora-rule)] py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-16">
        <div className="flex flex-col gap-6">
          <motion.div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--wiora-mute)]"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Interviews</span>
            <span className="hidden h-3 w-px bg-[var(--wiora-rule)] sm:block" />
            <span>Pitches</span>
            <span className="hidden h-3 w-px bg-[var(--wiora-rule)] sm:block" />
            <span>Client conversations</span>
          </motion.div>
          <motion.h1
            className="landing-hero-title max-w-[13ch]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            Practice the conversations that matter.
          </motion.h1>
          <motion.p
            className="max-w-[52ch] text-base leading-relaxed text-[var(--wiora-mute)] md:text-lg"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            An AI agent takes the other seat. You answer out loud, in real time,
            then review the session before the conversation that counts.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-2.5"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button asChild className={cn(landingPrimaryBtn, "h-10 text-xs md:text-sm lg:h-11 lg:text-base")}>
              <Link href="/sign-up">Start practicing</Link>
            </Button>
            <Button
              type="button"
              onClick={() => scrollToId("workflow")}
              className={cn(landingGhostBtn, "h-10 text-xs md:text-sm lg:h-11 lg:text-base")}
            >
              Learn more
            </Button>
          </motion.div>
        </div>

        <div className="relative isolate hidden h-[480px] overflow-visible md:block lg:h-[520px]">
          <motion.div
            className="absolute left-[3%] top-[4%] z-10 w-[min(78%,308px)] origin-center"
            initial={reduce ? false : { rotate: 0 }}
            animate={{ rotate: -6 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <ProductFrame path="wiora / agents / new">
              <DemoAgentForm compact />
            </ProductFrame>
          </motion.div>
          <motion.div
            className="absolute bottom-[6%] right-[3%] z-20 w-[min(84%,336px)] origin-center"
            initial={reduce ? false : { rotate: 0 }}
            animate={{ rotate: 6 }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.08 }}
          >
            <ProductFrame path="wiora / meetings / new">
              <DemoMeetingForm compact />
            </ProductFrame>
          </motion.div>
        </div>

        <div className="md:hidden">
          <ProductFrame path="wiora / agents / new">
            <DemoAgentForm />
          </ProductFrame>
        </div>
      </div>
    </section>
  );
}
