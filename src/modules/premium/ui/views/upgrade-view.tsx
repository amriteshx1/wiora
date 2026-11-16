"use client";

import { useSearchParams } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { CircleCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { WaitingButton } from "@/components/waiting-button";
import { cn } from "@/lib/utils";

const entryLabel: Record<string, string> = {
  purchase: "Credits purchased",
  reservation: "Interview held",
  deduction: "Interview started",
  restore: "Credit returned",
  refund: "Refund",
};

export const UpgradeView = () => {
  const trpc = useTRPC();
  const search = useSearchParams();
  const checkoutId = search.get("checkout_id");
  const { data } = useSuspenseQuery({
    ...trpc.premium.getBilling.queryOptions(),
    refetchInterval: checkoutId ? 2000 : false,
  });
  const checkout = useMutation(trpc.premium.createCheckout.mutationOptions({
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (error) => toast.error(error.message),
  }));
  const confirmed = checkoutId
    ? data.history.some((entry) => entry.checkoutId === checkoutId)
    : false;
  const planName = data.plans.find((plan) => plan.id === data.plan)?.name ?? data.plan;

  return (
    <div className="flex-1 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-10">
        <div>
          <h5 className="text-2xl font-medium tracking-tight">Credits</h5>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            Preparation stays free. One credit starts one 30-minute interview. Names, prices, and features come from Polar
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[24px] bg-muted/70 p-6">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="mt-2 text-4xl font-medium tabular-nums tracking-tight">{data.balance}</p>
          </div>
          <div className="rounded-[24px] bg-muted/70 p-6">
            <p className="text-sm text-muted-foreground">Latest bundle</p>
            <p className="mt-2 text-2xl font-medium tracking-tight">{planName ? planName : "None yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.plan
                ? `${data.creditsInPlan} credits in that purchase`
                : "Buy before a preparation, or when you run out"}
            </p>
          </div>
        </div>

        {checkoutId && !confirmed ? (
          <p className="text-sm text-muted-foreground">Confirming the payment</p>
        ) : null}

        <div className="grid items-stretch gap-3 md:grid-cols-3">
          {data.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex h-full flex-col gap-6 rounded-[24px] p-7",
                plan.highlighted ? "bg-muted py-8 md:py-10" : "border bg-background",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium tracking-tight md:text-xl">{plan.name}</h3>
                  {plan.badge ? <p className="mt-1 text-xs text-muted-foreground">{plan.badge}</p> : null}
                  {plan.description ? <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p> : null}
                </div>
                <p className="flex text-2xl font-medium tracking-tight md:text-3xl">
                  {plan.priceLabel}
                  {plan.priceSuffix ? <span className="self-end text-xs font-normal text-muted-foreground">{plan.priceSuffix}</span> : null}
                </p>
              </div>

              <WaitingButton
                type="button"
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                waiting={checkout.isPending}
                idle={plan.archived ? "Unavailable" : "Buy credits"}
                busy="Opening checkout"
                disabled={plan.archived}
                onClick={() => {
                  if (plan.archived) return;
                  checkout.mutate({ plan: plan.id });
                }}
              />

              <div className="flex flex-col items-start gap-y-2.5">
                <p className="mb-2 text-sm font-medium">Features</p>
                {plan.benefits.map((feature) => (
                  <p key={feature} className="flex items-center gap-x-2.5 text-xs font-medium">
                    <CircleCheckIcon className="size-4 fill-primary text-white" />
                    {feature}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[24px] border bg-background p-6">
          <h6 className="font-medium">History</h6>
          {data.history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Purchases and interviews will show up here</p>
          ) : (
            <div className="mt-4 divide-y">
              {data.history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div>
                    <p>{entryLabel[entry.entryType] ?? entry.entryType}</p>
                    <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-medium tabular-nums">{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const UpgradeViewLoading = () => {
  return (
    <LoadingState title="Loading credits" description="Opening billing" />
  );
};

export const UpgradeViewError = () => {
  return (
    <ErrorState title="Could not load credits" description="Try again in a moment" />
  );
};
