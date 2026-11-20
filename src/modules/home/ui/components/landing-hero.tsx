"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  landingGhostBtn,
  landingPrimaryBtn,
  scrollToId,
} from "@/modules/home/ui/components/landing-ui";

export function LandingHero() {
  return (
    <section id="about" className="scroll-mt-24">
      <div className="landing-shell grid items-start gap-x-8 gap-y-7 pb-8 pt-14 md:grid-cols-2 md:pb-10 md:pt-16 lg:gap-x-12">
        <h1 className="landing-hero-title max-w-[16ch]">
          Meet the other side before it matters.
        </h1>
        <p className="self-center text-[15px] leading-relaxed text-[var(--wiora-mute)] md:text-base md:leading-[1.6]">
          One real conversation you have coming. Give Wiora the context: who
          you are meeting, and what it is about. An AI counterpart then sits
          across from you and plays that person, live.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild className={cn(landingPrimaryBtn, "h-10 px-5")}>
            <Link href="/sign-up">Start preparing</Link>
          </Button>
          <Button
            type="button"
            onClick={() => scrollToId("workflow")}
            className={cn(landingGhostBtn, "h-10 px-5")}
          >
            How it works
          </Button>
        </div>
      </div>
    </section>
  );
}
