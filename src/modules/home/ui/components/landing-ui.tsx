"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const landingPrimaryBtn =
  "rounded-full bg-[#141414] text-white hover:bg-black h-9 px-4 text-sm font-medium shadow-none";

export const landingGhostBtn =
  "rounded-full border border-[#e5e5e5] bg-[var(--wiora-paper)] text-[#141414] hover:bg-[var(--wiora-mist)] h-9 px-4 text-sm font-medium shadow-none";

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
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
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
