"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import {
  BookOpenTextIcon,
  AudioLinesIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";

import { Reveal } from "@/modules/home/ui/components/landing-ui";
import { cn } from "@/lib/utils";

const situations = [
  {
    title: "Job interviews",
    body: "First rounds, follow-ups, and the question you only hear once you start talking.",
  },
  {
    title: "Investor pitches",
    body: "Tell the story out loud, then sit with the pushback before you are in the room.",
  },
  {
    title: "Client and sales calls",
    body: "Discovery, objections, and the turn where the conversation leaves your notes.",
  },
  {
    title: "Negotiations and reviews",
    body: "Give the agent a counterpart. Hear how your answers land while it is still practice.",
  },
];

const moreConversations = [
  "Presentations",
  "Discovery calls",
  "Salary conversations",
  "Board updates",
  "Performance reviews",
  "Partnership talks",
  "Stakeholder reviews",
];

const leftovers = [
  {
    title: "Summary",
    icon: BookOpenTextIcon,
    body: "An overview of the session and notes on what was covered.",
  },
  {
    title: "Transcript",
    icon: SearchIcon,
    body: "Search the moment you stalled, hedged, or answered cleanly.",
  },
  {
    title: "Recording",
    icon: AudioLinesIcon,
    body: "Play the session back and hear yourself in the conversation.",
  },
  {
    title: "Ask AI",
    icon: SparklesIcon,
    body: "Chat about that session. It already has the transcript.",
  },
];

function SeatMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 24"
      className={cn("mb-5 h-6 w-14 text-[var(--wiora-ink)]", className)}
      aria-hidden
    >
      <rect
        x="1.25"
        y="5.25"
        width="18.5"
        height="13.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="36.25"
        y="5.25"
        width="18.5"
        height="13.5"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M23 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function LandingProblem() {
  return (
    <section>
      <div className="landing-shell grid items-start gap-10 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-20">
        <Reveal>
          <h2 className="landing-section-title max-w-[16ch]">
            You can script your answers. You cannot script theirs.
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="lg:border-l lg:border-[var(--wiora-rule)] lg:pl-14">
          <SeatMark />
          <p className="max-w-[62ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-[1.05rem] md:leading-[1.65]">
            The other person will not stay on your list. Questions, pressure, and
            follow-ups arrive while you are still speaking. Notes cannot simulate
            that. Wiora puts an agent in the other seat for a live voice session,
            so you practice the conversation itself, then end the call when you
            are done.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function roundPx(n: number) {
  return Math.round(n) + 0.5;
}

function pairPath(
  wrap: DOMRect,
  center: DOMRect,
  left: DOMRect,
  right: DOMRect,
  edge: "top" | "bottom",
) {
  const cx = center.left + center.width / 2 - wrap.left;
  const cEdge =
    edge === "top" ? center.top - wrap.top : center.bottom - wrap.top;
  const leftY = left.top + left.height / 2 - wrap.top;
  const rightY = right.top + right.height / 2 - wrap.top;
  const leftX = left.right - wrap.left - 1;
  const rightX = right.left - wrap.left + 1;

  return `M ${roundPx(leftX)} ${roundPx(leftY)} H ${roundPx(cx)} V ${roundPx(cEdge)} V ${roundPx(rightY)} H ${roundPx(rightX)}`;
}

function spinePairPath(wrap: DOMRect, first: DOMRect, second: DOMRect) {
  const spineX = 11;
  const firstY = first.top + first.height / 2 - wrap.top;
  const secondY = second.top + second.height / 2 - wrap.top;
  const firstX = first.left - wrap.left;
  const secondX = second.left - wrap.left;

  return `M ${roundPx(firstX)} ${roundPx(firstY)} H ${roundPx(spineX)} V ${roundPx(secondY)} H ${roundPx(secondX)}`;
}

function useNetworkPaths(
  wrapRef: RefObject<HTMLDivElement | null>,
  centerRef: RefObject<HTMLDivElement | null>,
  variant: "corner" | "spine",
) {
  const [paths, setPaths] = useState<{ upper: string; lower: string }>({
    upper: "",
    lower: "",
  });
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const wrapBox = wrap.getBoundingClientRect();
      const center = centerRef.current?.getBoundingClientRect();
      if (!center) return;

      setSize({ w: wrap.clientWidth, h: wrap.clientHeight });
      if (wrap.clientWidth < 40) {
        setPaths({ upper: "", lower: "" });
        return;
      }

      const nodes = [...wrap.querySelectorAll<HTMLElement>("[data-situation-node]")];
      nodes.sort(
        (a, b) =>
          Number(a.dataset.situationNode) - Number(b.dataset.situationNode),
      );
      if (nodes.length < 4) return;

      const boxes = nodes.map((node) => node.getBoundingClientRect());
      if (variant === "spine") {
        setPaths({
          upper: spinePairPath(wrapBox, boxes[0], boxes[1]),
          lower: spinePairPath(wrapBox, boxes[2], boxes[3]),
        });
        return;
      }

      setPaths({
        upper: pairPath(wrapBox, center, boxes[0], boxes[1], "top"),
        lower: pairPath(wrapBox, center, boxes[2], boxes[3], "bottom"),
      });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    if (centerRef.current) ro.observe(centerRef.current);
    wrap.querySelectorAll("[data-situation-node]").forEach((node) => {
      ro.observe(node);
    });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant, wrapRef, centerRef]);

  return { paths, size };
}

function ConnectorLayer({
  width,
  height,
  upper,
  lower,
  className,
}: {
  width: number;
  height: number;
  upper: string;
  lower: string;
  className?: string;
}) {
  if (width === 0 || height === 0) return null;

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 text-[var(--wiora-rule)]",
        className,
      )}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      {upper ? (
        <path
          d={upper}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {lower ? (
        <path
          d={lower}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}

function CenterSeat() {
  return (
    <div className="flex flex-col items-center gap-3 bg-[var(--wiora-paper)]">
      <Image
        src="/logo-black.svg"
        alt=""
        width={36}
        height={36}
        className="size-9 lg:size-10"
      />
      <p className="landing-display text-xl leading-none lg:text-2xl">Wiora</p>
      <p className="text-[11px] leading-none text-[var(--wiora-mute)] lg:text-xs">
        The other seat
      </p>
    </div>
  );
}

function SituationCopy({
  item,
  align = "start",
}: {
  item: (typeof situations)[number];
  align?: "start" | "end";
}) {
  return (
    <div className={cn(align === "end" && "text-right")}>
      <p className="text-[0.95rem] font-medium md:text-base lg:text-[1.05rem]">
        {item.title}
      </p>
      <p className="mt-2 max-w-[30ch] text-[13px] leading-relaxed text-[var(--wiora-mute)] md:text-sm">
        {item.body}
      </p>
    </div>
  );
}

function OpenFrame({
  side,
  nodeId,
  children,
  className,
}: {
  side: "left" | "right";
  nodeId: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-situation-node={nodeId}
      className={cn(
        "relative bg-[var(--wiora-paper)] px-5 py-5 md:px-6 md:py-6",
        "border-[var(--wiora-rule)]",
        side === "left" && "border-y border-r",
        side === "right" && "border-y border-l",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DesktopSituationNetwork() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const { paths, size } = useNetworkPaths(wrapRef, centerRef, "corner");

  return (
    <div
      ref={wrapRef}
      className="relative isolate hidden min-h-[29rem] overflow-visible md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-rows-[1fr_auto_1fr] md:gap-x-10 lg:min-h-[36rem] lg:gap-x-14 xl:min-h-[40rem] xl:gap-x-20"
    >
      <div className="relative z-[1] col-start-1 row-start-1 min-w-0 self-start justify-self-start">
        <OpenFrame side="left" nodeId={0} className="max-w-full lg:max-w-[23rem]">
          <SituationCopy item={situations[0]} />
        </OpenFrame>
      </div>
      <div className="relative z-[1] col-start-3 row-start-1 min-w-0 self-start justify-self-end">
        <OpenFrame side="right" nodeId={1} className="max-w-full lg:max-w-[23rem]">
          <SituationCopy item={situations[1]} align="end" />
        </OpenFrame>
      </div>
      <div className="relative z-[1] col-start-2 row-start-2 flex items-center justify-center">
        <div ref={centerRef} className="px-5 py-4 lg:px-8 lg:py-5">
          <CenterSeat />
        </div>
      </div>
      <div className="relative z-[1] col-start-1 row-start-3 min-w-0 self-end justify-self-start">
        <OpenFrame side="left" nodeId={2} className="max-w-full lg:max-w-[23rem]">
          <SituationCopy item={situations[2]} />
        </OpenFrame>
      </div>
      <div className="relative z-[1] col-start-3 row-start-3 min-w-0 self-end justify-self-end">
        <OpenFrame side="right" nodeId={3} className="max-w-full lg:max-w-[23rem]">
          <SituationCopy item={situations[3]} align="end" />
        </OpenFrame>
      </div>
      <ConnectorLayer
        className="z-0 col-start-1 col-end-4 row-start-1 row-end-4"
        width={size.w}
        height={size.h}
        upper={paths.upper}
        lower={paths.lower}
      />
    </div>
  );
}

function MobileSituationNetwork() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const { paths, size } = useNetworkPaths(wrapRef, centerRef, "spine");

  return (
    <div ref={wrapRef} className="relative isolate overflow-visible md:hidden">
      <div ref={centerRef} className="relative z-[1] mb-10 flex justify-center">
        <CenterSeat />
      </div>
      <div className="relative z-[1] flex flex-col gap-8 pl-7">
        {situations.map((item, index) => (
          <OpenFrame key={item.title} side="left" nodeId={index}>
            <SituationCopy item={item} />
          </OpenFrame>
        ))}
      </div>
      <ConnectorLayer
        width={size.w}
        height={size.h}
        upper={paths.upper}
        lower={paths.lower}
      />
    </div>
  );
}

function SituationNetwork() {
  return (
    <>
      <DesktopSituationNetwork />
      <MobileSituationNetwork />
    </>
  );
}

export function LandingSituations() {
  return (
    <section
      id="features"
      className="scroll-mt-24"
    >
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:gap-16">
        <Reveal className="max-w-[40rem]">
          <h2 className="landing-section-title">
            Whatever the conversation, the other seat is ready.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            Interviews, pitches, client calls, negotiations. You choose the role.
            The session is the same: speak, respond, review.
          </p>
        </Reveal>

        <SituationNetwork />

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="landing-display text-[1.5rem] leading-tight md:text-[1.75rem]">
            And a lot more.
          </p>
          <p className="max-w-[46rem] text-[13px] leading-relaxed text-[var(--wiora-mute)]">
            {moreConversations.join("  ·  ")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function LandingAfter() {
  return (
    <section>
      <div className="landing-shell flex flex-col gap-12 border-b border-[var(--wiora-rule)] py-16 md:py-24 lg:gap-16">
        <Reveal className="max-w-[42rem]">
          <h2 className="landing-section-title">
            The session ends. The record stays.
          </h2>
          <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--wiora-mute)] md:text-base">
            When you hang up, Wiora keeps a summary, a searchable transcript, the
            recording, and Ask AI on that session. The next day, a short follow-up
            arrives by email. Run it again if you want another pass.
          </p>
        </Reveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {leftovers.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <item.icon
                className="mb-4 size-4 text-[var(--wiora-ink)]"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="text-sm font-medium md:text-base">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--wiora-mute)]">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
