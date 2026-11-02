"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  DemoAgentForm,
  DemoCall,
  DemoMeetingForm,
  DemoPostCall,
} from "@/modules/home/ui/components/landing-demos";
import { ProductFrame, Reveal } from "@/modules/home/ui/components/landing-ui";
import { cn } from "@/lib/utils";

const steps = [
  {
    n: "1",
    title: "Describe the situation",
    body: "Write the conversation you are preparing for and add the documents that matter. The brief is built from that, not from a role you invent.",
    path: "wiora / preparations / new",
    reverse: false,
    demo: "agent" as const,
  },
  {
    n: "2",
    title: "Read the brief",
    body: "Check the facts, the unknowns, and how the conversation will feel. Correct anything that is wrong before you pay.",
    path: "wiora / preparations / brief",
    reverse: true,
    demo: "meeting" as const,
  },
  {
    n: "3",
    title: "Practice live",
    body: "Pay $2, $3, or $4 for 30, 45, or 60 minutes. You speak. The counterpart listens and changes direction from what you just said.",
    path: "wiora / call",
    reverse: false,
    demo: "call" as const,
  },
  {
    n: "4",
    title: "Read the report",
    body: "The report explains what went wrong, why, and what a stronger answer needed. Practice that again, or take the next practice, as a new paid session.",
    path: "wiora / preparations / report",
    reverse: true,
    demo: "recap" as const,
  },
];

function StepDemo({ demo }: { demo: (typeof steps)[number]["demo"] }) {
  if (demo === "agent") return <DemoAgentForm animate framed />;
  if (demo === "meeting") return <DemoMeetingForm framed />;
  if (demo === "call") return <DemoCall />;
  return <DemoPostCall />;
}

export function LandingWorkflow() {
  const reduce = useReducedMotion();

  return (
    <section
      id="workflow"
      className="scroll-mt-24"
    >
      <div className="landing-shell flex flex-col gap-16 border-b border-[var(--wiora-rule)] py-16 md:gap-24 md:py-24">
        <Reveal className="max-w-[42rem]">
          <h2 className="landing-section-title">
            Set the role. Then speak.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Prepare the situation, pay for one live session, then read the report.
          </p>
        </Reveal>

        <div className="flex flex-col gap-16 md:gap-24">
          {steps.map((step) => (
            <div
              key={step.n}
              className={cn(
                "flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-20",
                step.reverse && "md:flex-row-reverse",
              )}
            >
              <motion.div
                className="w-full md:w-[48%]"
                initial={reduce ? false : { opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductFrame
                  path={step.path}
                  className="flex h-[17.5rem] w-full flex-col text-[0.94em]"
                  bodyClassName={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden",
                    step.demo === "call" ? "justify-center px-2 py-2.5" : "p-4",
                    (step.demo === "agent" || step.demo === "meeting") &&
                      "justify-stretch",
                  )}
                >
                  <StepDemo demo={step.demo} />
                </ProductFrame>
              </motion.div>

              <div
                className={cn(
                  "flex w-full flex-col gap-2 text-center md:w-[42%] md:gap-4 md:text-left",
                  step.reverse && "md:pl-5 lg:pl-8",
                )}
              >
                <p className="landing-display text-4xl text-[var(--wiora-ink)]/25 md:text-5xl">
                  {step.n}
                </p>
                <p className="text-base font-medium md:text-lg lg:text-xl">
                  {step.title}
                </p>
                <p className="text-xs leading-relaxed text-[var(--wiora-mute)] md:text-sm lg:text-base">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
