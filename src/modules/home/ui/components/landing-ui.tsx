"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export const landingPrimaryBtn =
  "rounded-sm bg-black text-white hover:bg-neutral-800 h-10 px-5 text-sm font-medium shadow-none";

export const landingGhostBtn =
  "rounded-sm bg-white text-[#141414] border border-[#141414]/80 hover:bg-[#f5f5f4] h-10 px-5 text-sm font-medium shadow-none";

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
};

export function ProductFrame({
  path,
  children,
  className,
  bodyClassName,
}: {
  path: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--wiora-rule)] bg-white shadow-[0_24px_60px_-32px_rgba(20,20,20,0.22)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--wiora-rule)] bg-[#fafafa] px-3.5 py-2">
        <span className="flex gap-1">
          <span className="size-[7px] rounded-full bg-[#d4d4d0]" />
          <span className="size-[7px] rounded-full bg-[#d4d4d0]" />
          <span className="size-[7px] rounded-full bg-[#d4d4d0]" />
        </span>
        <span className="truncate text-[11px] text-[var(--wiora-mute)]">
          {path}
        </span>
      </div>
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
