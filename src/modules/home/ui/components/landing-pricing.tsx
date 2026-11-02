"use client";

import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, landingPrimaryBtn } from "@/modules/home/ui/components/landing-ui";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "30 minutes",
    blurb: "One practice session",
    price: "$2",
    suffix: "",
    featured: false,
    features: [
      "One situation",
      "One continuous session",
      "A report when it ends",
    ],
  },
  {
    name: "45 minutes",
    blurb: "More room to go deeper",
    price: "$3",
    suffix: "",
    featured: true,
    features: [
      "One situation",
      "One continuous session",
      "A report when it ends",
    ],
  },
  {
    name: "60 minutes",
    blurb: "The longest single session",
    price: "$4",
    suffix: "",
    featured: false,
    features: [
      "One situation",
      "One continuous session",
      "A report when it ends",
    ],
  },
];

export function LandingPricing() {
  return (
    <section>
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:gap-16 md:py-24">
        <Reveal className="mx-auto max-w-[36rem] text-center">
          <h2 className="landing-section-title">One session</h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            More time in live sessions, and a kept record after every call.
          </p>
        </Reveal>

        <div className="grid items-center gap-3 md:grid-cols-3 md:gap-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "flex flex-col gap-6 border border-[var(--wiora-rule)] p-6",
                plan.featured && "bg-[var(--wiora-mist)] py-8 md:py-10",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium md:text-xl">{plan.name}</h3>
                  <p className="mt-1 text-xs text-neutral-700">{plan.blurb}</p>
                </div>
                <p className="flex text-2xl font-medium md:text-3xl">
                  {plan.price}
                  <span className="self-end text-xs font-normal">{plan.suffix}</span>
                </p>
              </div>

              <Button asChild className={cn("w-full rounded-sm shadow-none", landingPrimaryBtn)}>
                <Link href="/sign-up">Start a preparation</Link>
              </Button>

              <div className="flex flex-col items-start gap-y-2.5">
                <p className="mb-2 text-sm font-medium">Features</p>
                {plan.features.map((feature) => (
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
