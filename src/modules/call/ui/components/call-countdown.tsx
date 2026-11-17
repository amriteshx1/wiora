"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function remainingParts(endsAt: number) {
  const remaining = Math.max(0, endsAt - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

function RollingDigit({ value }: { value: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span className="inline-block w-[0.72em] text-center">{value}</span>;
  }

  return (
    <span className="relative inline-block h-[1.05em] w-[0.72em] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-70%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "70%", opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[3.4rem] flex-col items-center rounded-xl border border-white/10 bg-[#1c1c1c] px-2.5 py-1.5">
      <p className="flex text-lg font-medium leading-none tabular-nums tracking-tight text-[#f5f5f4]">
        {value.split("").map((digit, index) => (
          <RollingDigit key={`${label}-${index}`} value={digit} />
        ))}
      </p>
      <p className="mt-1 text-[10px] leading-none text-white/40">{label}</p>
    </div>
  );
}

export function CallCountdown({ endsAt }: { endsAt: number }) {
  const [parts, setParts] = useState(() => remainingParts(endsAt));

  useEffect(() => {
    const tick = () => setParts(remainingParts(endsAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const minutes = String(parts.minutes).padStart(2, "0");
  const seconds = String(parts.seconds).padStart(2, "0");

  return (
    <div
      className="flex items-center gap-2"
      aria-live="polite"
      aria-label={`${parts.minutes} minutes and ${parts.seconds} seconds remaining`}
    >
      <Unit value={minutes} label="min" />
      <Unit value={seconds} label="sec" />
    </div>
  );
}
