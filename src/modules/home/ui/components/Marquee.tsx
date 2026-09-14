"use client";

import { useReducedMotion } from "framer-motion";
import Marquee from "react-fast-marquee";

const forward = [
  "Job interviews",
  "Investor pitches",
  "Client conversations",
  "Sales calls",
  "Negotiations",
  "Presentations",
];

const reverse = [
  "Board updates",
  "Performance reviews",
  "Discovery calls",
  "Salary conversations",
  "Partnership talks",
  "Stakeholder reviews",
];

function Band({
  items,
  direction,
}: {
  items: string[];
  direction: "left" | "right";
}) {
  return (
    <div className="flex gap-10 whitespace-nowrap pr-10 text-sm font-light text-[var(--wiora-mute)] md:gap-14 md:text-base lg:gap-16">
      {items.map((label) => (
        <span key={`${direction}-${label}`}>{label}</span>
      ))}
    </div>
  );
}

function Track({
  items,
  direction,
  reduce,
}: {
  items: string[];
  direction: "left" | "right";
  reduce: boolean | null;
}) {
  if (reduce) return <Band items={items} direction={direction} />;

  return (
    <Marquee gradient={false} speed={26} pauseOnHover direction={direction}>
      <Band items={items} direction={direction} />
    </Marquee>
  );
}

export default function FeatureMarquee() {
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="landing-shell border-b border-[var(--wiora-rule)] py-10 md:py-12">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="relative h-[268px] md:h-[300px]">
            <div className="absolute top-1/2 left-0 w-full origin-center -translate-y-1/2 -rotate-[8deg] border-y border-[var(--wiora-rule)] bg-white py-2.5">
              <Track items={forward} direction="left" reduce={reduce} />
            </div>
            <div className="absolute top-1/2 left-0 w-full origin-center -translate-y-1/2 rotate-[8deg] border-y border-[var(--wiora-rule)] bg-white py-2.5">
              <Track items={reverse} direction="right" reduce={reduce} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
