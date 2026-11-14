"use client";

import { useSearchParams } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PricingCard } from "../components/pricing-card";

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
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h5 className="text-2xl font-medium md:text-3xl">Upgrade</h5>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Preparation, documents, research, and the situation brief stay free. Plan names, prices, and features come from Polar. One credit starts one 30-minute interview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-background p-6">
            <p className="text-sm text-muted-foreground">Available credits</p>
            <p className="mt-2 text-4xl font-medium">{data.balance}</p>
          </div>
          <div className="rounded-lg border bg-background p-6">
            <p className="text-sm text-muted-foreground">Latest bundle</p>
            <p className="mt-2 text-2xl font-medium">{planName ? planName : "None yet"}</p>
            {data.plan ? (
              <p className="mt-1 text-sm text-muted-foreground">{data.creditsInPlan} credits in that purchase</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Buy a bundle whenever you want, including before a preparation.</p>
            )}
          </div>
        </div>

        {checkoutId && !confirmed ? (
          <p className="text-sm text-muted-foreground">Confirming the payment. Credits appear here after Polar verifies it.</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {data.plans.map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.name}
              description={plan.description}
              badge={plan.badge}
              variant={plan.highlighted ? "highlighted" : "default"}
              price={plan.priceAmount / 100}
              priceSuffix={plan.priceSuffix}
              features={plan.benefits}
              buttonText={plan.archived ? "Unavailable" : "Upgrade"}
              onClick={() => {
                if (plan.archived || checkout.isPending) return;
                checkout.mutate({ plan: plan.id });
              }}
            />
          ))}
        </div>

        <div className="rounded-lg border bg-background p-6">
          <h6 className="font-medium">Credit history</h6>
          {data.history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Purchases and interviews will show up here.</p>
          ) : (
            <div className="mt-4 divide-y">
              {data.history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div>
                    <p>{entryLabel[entry.entryType] ?? entry.entryType}</p>
                    <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="font-medium">{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</p>
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
    <LoadingState title="Loading" description="This may take a few seconds" />
  );
};

export const UpgradeViewError = () => {
  return (
    <ErrorState title="Error" description="Please try again later" />
  );
};
