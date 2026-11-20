"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Button> & {
  waiting?: boolean;
  idle: React.ReactNode;
  busy: React.ReactNode;
};

export function WaitingButton({
  waiting = false,
  idle,
  busy,
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <Button
      {...props}
      aria-busy={waiting}
      disabled={waiting || disabled}
      className={cn(
        "relative overflow-hidden disabled:opacity-100",
        waiting && "pointer-events-none",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        {waiting ? (
          <span className="size-1.5 shrink-0 rounded-full bg-current" />
        ) : null}
        {waiting ? busy : idle}
        {children}
      </span>
      {waiting ? (
        <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px overflow-hidden">
          <span className="waiting-line block h-full w-1/3 bg-current/80" />
        </span>
      ) : null}
    </Button>
  );
}
