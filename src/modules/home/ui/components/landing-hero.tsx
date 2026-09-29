"use client";

import { useEffect, useState } from "react";
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

const ease = [0.22, 1, 0.36, 1] as const;

const heroDots =
  "[&>div>span:first-child>span:nth-child(2)]:bg-[#9a9a96] [&>div>span:first-child>span:nth-child(3)]:bg-[#3a3a3a]";

const cardMotion = {
  duration: 1.1,
  ease,
  zIndex: { delay: 0.55, duration: 0 },
  boxShadow: { duration: 1.1, ease },
};

const backCard = {
  top: "2%",
  left: "0%",
  width: "100%",
  scale: 0.975,
  zIndex: 10,
  boxShadow: "0 18px 44px -30px rgba(20,20,20,0.22)",
};

const frontCard = {
  top: "34%",
  left: "14%",
  width: "86%",
  scale: 1,
  zIndex: 20,
  boxShadow: "0 24px 50px -26px rgba(20,20,20,0.34)",
};

export function LandingHero() {
  const reduce = useReducedMotion();
  const [lead, setLead] = useState<"meeting" | "agent">("meeting");

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setLead((current) => (current === "meeting" ? "agent" : "meeting"));
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduce]);

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
            <span>Pitches</span>
            <span className="hidden h-3 w-px bg-[var(--wiora-rule)] sm:block" />
            <span>Client conversations</span>
            <span className="hidden h-3 w-px bg-[var(--wiora-rule)] sm:block" />
            <span>Interviews</span>
          </motion.div>
          <motion.h1
            className="landing-hero-title max-w-[13ch]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            Meet the other side before it matters.
          </motion.h1>
          <motion.p
            className="max-w-[52ch] text-base leading-relaxed text-[var(--wiora-mute)] md:text-lg"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            Explore high-stakes conversations, test your ideas, and discover
            new perspectives with an AI counterpart that meets you in real time.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-2.5"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button asChild className={cn(landingPrimaryBtn, "h-10 text-xs md:text-sm lg:h-11 lg:text-base")}>
              <Link href="/sign-up">Start a session</Link>
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

        <div className="relative isolate hidden h-[480px] min-w-0 overflow-hidden md:block lg:h-[540px]">
          <motion.div
            className="absolute"
            style={{ transformOrigin: "left top" }}
            initial={false}
            animate={!reduce && lead === "agent" ? frontCard : backCard}
            transition={cardMotion}
          >
            <ProductFrame
              path="wiora / agents / new"
              className={cn(
                "shadow-none [&_form>div:last-child>button:last-child]:pointer-events-none [&_form>div:last-child>button:last-child]:opacity-0 [&_form>div:last-child>button:last-child]:[anchor-name:--hero-create-agent]",
                heroDots,
              )}
            >
              <DemoAgentForm compact />
            </ProductFrame>
          </motion.div>
          <motion.div
            className="absolute"
            style={{ transformOrigin: "left top" }}
            initial={false}
            animate={reduce || lead === "meeting" ? frontCard : backCard}
            transition={cardMotion}
          >
            <ProductFrame
              path="wiora / meetings / new"
              className={cn(
                "shadow-none [&_form>div:last-child>button:last-child]:pointer-events-none [&_form>div:last-child>button:last-child]:opacity-0 [&_form>div:last-child>button:last-child]:[anchor-name:--hero-create-meeting]",
                heroDots,
              )}
            >
              <DemoMeetingForm compact />
            </ProductFrame>
          </motion.div>
          <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(to_right,transparent_68%,var(--wiora-paper)_100%)]" />
          <div
            className={cn(
              "absolute z-40 [top:anchor(top)] [left:anchor(left)]",
              lead === "meeting"
                ? "[position-anchor:--hero-create-meeting]"
                : "[position-anchor:--hero-create-agent]",
            )}
          >
            <Button type="button" className="h-6 px-2 text-xs">
              Create
            </Button>
          </div>
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
