"use client";

import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, landingGhostBtn, landingPrimaryBtn } from "@/modules/home/ui/components/landing-ui";
import { cn } from "@/lib/utils";

export type LandingPlan = {
  id: string;
  name: string;
  description: string | null;
  benefits: string[];
  badge: string | null;
  highlighted: boolean;
  priceLabel: string;
  priceSuffix: string;
};

export function LandingPricing({ plans }: { plans: LandingPlan[] }) {
  return (
    <section id="credits" className="scroll-mt-24">
      <div className="landing-shell flex flex-col gap-12 py-16 md:gap-14 md:py-24">
        <Reveal className="max-w-[36rem]">
          <h2 className="landing-section-title">Credits, not a subscription</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Preparation is free. Buy credits when you are ready to practice. One
            credit is one 30-minute live session. Packs differ only by how many
            you get.
          </p>
        </Reveal>

        <div className="grid items-stretch gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col gap-6 rounded-[24px] bg-[var(--wiora-mist)] p-7",
                plan.highlighted && "bg-[#141414] text-white md:py-9",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium tracking-tight">{plan.name}</h3>
                  {plan.badge ? (
                    <p className={cn("mt-1 text-xs", plan.highlighted ? "text-white/60" : "text-[var(--wiora-mute)]")}>
                      {plan.badge}
                    </p>
                  ) : null}
                  {plan.description ? (
                    <p className={cn("mt-1 text-xs", plan.highlighted ? "text-white/60" : "text-[var(--wiora-mute)]")}>
                      {plan.description}
                    </p>
                  ) : null}
                </div>
                <p className="flex text-2xl font-medium tracking-tight md:text-[1.75rem]">
                  {plan.priceLabel}
                  {plan.priceSuffix ? (
                    <span className="self-end text-xs font-normal opacity-70">{plan.priceSuffix}</span>
                  ) : null}
                </p>
              </div>

              <Button
                asChild
                className={cn(
                  "w-full rounded-full shadow-none",
                  plan.highlighted ? landingGhostBtn : landingPrimaryBtn,
                )}
              >
                <Link href="/sign-up">Start preparing</Link>
              </Button>

              <div className="flex flex-col items-start gap-y-2.5">
                {plan.benefits.map((feature) => (
                  <p
                    key={feature}
                    className={cn(
                      "flex items-center gap-x-2.5 text-[13px]",
                      plan.highlighted ? "text-white/80" : "text-[var(--wiora-ink)]",
                    )}
                  >
                    <CircleCheckIcon
                      className={cn(
                        "size-4",
                        plan.highlighted ? "text-white" : "fill-[#141414] text-white",
                      )}
                    />
                    {feature}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
