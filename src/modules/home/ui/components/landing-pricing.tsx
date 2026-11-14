"use client";

import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, landingPrimaryBtn } from "@/modules/home/ui/components/landing-ui";
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
    <section>
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:gap-16 md:py-24">
        <Reveal className="mx-auto max-w-[36rem] text-center">
          <h2 className="landing-section-title">Interview credits</h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Preparation is free. Buy credits when you are ready to interview. One credit is one 30-minute interview, and the plans differ only by how many credits you get.
          </p>
        </Reveal>

        <div className="grid items-center gap-3 md:grid-cols-3 md:gap-4">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col gap-6 border border-[var(--wiora-rule)] p-6",
                plan.highlighted && "bg-[var(--wiora-mist)] py-8 md:py-10",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium md:text-xl">{plan.name}</h3>
                  {plan.badge ? <p className="mt-1 text-xs text-neutral-700">{plan.badge}</p> : null}
                  {plan.description ? <p className="mt-1 text-xs text-neutral-700">{plan.description}</p> : null}
                </div>
                <p className="flex text-2xl font-medium md:text-3xl">
                  {plan.priceLabel}
                  {plan.priceSuffix ? <span className="self-end text-xs font-normal">{plan.priceSuffix}</span> : null}
                </p>
              </div>

              <Button asChild className={cn("w-full rounded-sm shadow-none", landingPrimaryBtn)}>
                <Link href="/sign-up">Start preparing</Link>
              </Button>

              <div className="flex flex-col items-start gap-y-2.5">
                <p className="mb-2 text-sm font-medium">Features</p>
                {plan.benefits.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-center gap-x-2.5 text-xs font-medium"
                  >
                    <CircleCheckIcon className="size-4 fill-primary text-white" />
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
