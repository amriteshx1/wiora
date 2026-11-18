"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RocketIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import {
  FREE_PREPARATION_CREDITS,
  PLAN_CREDITS,
  PLAN_PREPARATION_CREDITS,
  type PlanId,
} from "@/modules/preparations/server/credit-rules";

const PLAN_LABEL: Record<PlanId, string> = {
  pro: "Pro",
  plus: "Premium",
  super: "Super",
};

function barValue(remaining: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((remaining / total) * 100));
}

function CreditRow({
  label,
  remaining,
  total,
}: {
  label: string;
  remaining: number;
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-sidebar-foreground">
        <span className="tabular-nums">{remaining}</span>
        {total > 0 ? <span className="tabular-nums">/{total}</span> : null}
        <span className="ml-1">{label}</span>
      </p>
      <Progress
        value={barValue(remaining, total)}
        className="h-1 bg-white/10 [&_[data-slot=progress-indicator]]:bg-white"
      />
    </div>
  );
}

export function DashboardSidebarPlanCard() {
  const trpc = useTRPC();
  const { data, isPending } = useQuery({
    ...trpc.premium.getBalance.queryOptions(),
    refetchOnWindowFocus: true,
  });

  if (isPending) {
    return (
      <div className="rounded-[24px] border border-sidebar-border bg-sidebar-accent/40 p-4">
        <Skeleton className="h-4 w-24 bg-sidebar-foreground/10" />
        <Skeleton className="mt-3 h-8 w-full bg-sidebar-foreground/10" />
        <Skeleton className="mt-2 h-8 w-full bg-sidebar-foreground/10" />
        <Skeleton className="mt-3 h-8 w-full bg-sidebar-foreground/10" />
      </div>
    );
  }

  if (!data) return null;

  const planLabel = data.plan ? PLAN_LABEL[data.plan] : "Free";
  const preparationTotal = data.plan
    ? PLAN_PREPARATION_CREDITS[data.plan] + FREE_PREPARATION_CREDITS
    : FREE_PREPARATION_CREDITS;
  const sessionTotal = data.plan ? PLAN_CREDITS[data.plan] : 0;
  const sessionRemaining = data.plan ? data.balance : 0;

  return (
    <aside className="overflow-hidden rounded-[24px] border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground">
      <div className="p-4 pb-4">
        <div className="flex items-center gap-2">
          <RocketIcon className="size-3.5 shrink-0 text-sidebar-foreground/80" strokeWidth={2.25} />
          <p className="text-sm font-medium leading-none">{planLabel}</p>
        </div>
        <div className="mt-5 space-y-4">
          <CreditRow
            label="Preparations"
            remaining={data.preparationBalance}
            total={preparationTotal}
          />
          <CreditRow
            label="Live Sessions"
            remaining={sessionRemaining}
            total={sessionTotal}
          />
        </div>
      </div>
      <Link
        href="/upgrade"
        className={cn(
          "block border-t border-sidebar-border px-3 py-3.5 text-center text-sm font-medium",
          "text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
        )}
      >
        Add Credits
      </Link>
    </aside>
  );
}