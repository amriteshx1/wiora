"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

interface Props {
  preparationId: string;
}

export function SessionCheckout({ preparationId }: Props) {
  const trpc = useTRPC();
  const search = useSearchParams();
  const waitingForCheckout = Boolean(search.get("checkout_id"));
  const products = useQuery(trpc.premium.getSessionProducts.queryOptions());
  const latest = useQuery({
    ...trpc.runs.getLatest.queryOptions({ preparationId }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (waitingForCheckout && status !== "paid" && status !== "active" && status !== "processing") {
        return 2000;
      }
      return status === "unpaid" ? 2000 : false;
    },
  });
  const checkout = useMutation(trpc.runs.createCheckout.mutationOptions({
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (error) => toast.error(error.message),
  }));

  const run = latest.data;
  if (run?.status === "paid" || run?.status === "active") {
    return (
      <div className="mt-8 space-y-3 border-t pt-6">
        <p className="text-sm">This session is paid.</p>
        <Button asChild>
          <Link href={`/call/${run.id}`}>Join</Link>
        </Button>
      </div>
    );
  }

  if (run?.status === "processing") {
    return (
      <p className="mt-8 border-t pt-6 text-sm">The report is being written.</p>
    );
  }

  return (
    <div className="mt-8 space-y-3 border-t pt-6">
      <h6 className="font-medium">Start a session</h6>
      {products.data?.[0]?.localFree ? (
        <p className="text-sm text-muted-foreground">Local only. Starting a session does not charge you.</p>
      ) : null}
      {run?.status === "unpaid" ? <p className="text-sm text-muted-foreground">Waiting for payment.</p> : null}
      {run?.status === "failed" ? <p className="text-sm">This session could not be started.</p> : null}
      <div className="flex flex-wrap gap-2">
        {(products.data ?? []).map((product) => (
          <Button
            key={product.minutes}
            type="button"
            variant="outline"
            disabled={checkout.isPending || (!product.localFree && !product.productId)}
            onClick={() => checkout.mutate({
              preparationId,
              durationMinutes: product.minutes,
            })}
          >
            {product.localFree ? `${product.minutes} minutes` : `${product.minutes} minutes ${product.price}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
