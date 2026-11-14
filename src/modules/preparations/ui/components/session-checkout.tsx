"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

interface Props {
  preparationId: string;
}

export function SessionCheckout({ preparationId }: Props) {
  const trpc = useTRPC();
  const balance = useQuery(trpc.premium.getBalance.queryOptions());
  const latest = useQuery({
    ...trpc.runs.getLatest.queryOptions({ preparationId }),
    refetchInterval: (query) => query.state.data?.status === "processing" ? 2000 : false,
  });
  const start = useMutation(trpc.runs.startInterview.mutationOptions({
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
    onError: (error) => toast.error(error.message),
  }));

  const run = latest.data;
  if (run?.status === "paid" || run?.status === "active") {
    return (
      <div className="mt-8 space-y-3 border-t pt-6">
        <p className="text-sm">This interview is ready.</p>
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

  const credits = balance.data?.balance ?? 0;

  return (
    <div className="mt-8 space-y-3 border-t pt-6">
      <h6 className="font-medium">Start the interview</h6>
      <p className="text-sm text-muted-foreground">
        Preparation stays free. One credit starts one 30-minute interview.
        {balance.data ? ` You have ${credits} ${credits === 1 ? "credit" : "credits"}.` : ""}
      </p>
      {run?.status === "failed" ? <p className="text-sm">The last interview did not start.</p> : null}
      {balance.isPending ? <p className="text-sm text-muted-foreground">Checking credits.</p> : null}
      {!balance.isPending && credits > 0 ? (
        <Button
          type="button"
          disabled={start.isPending}
          onClick={() => start.mutate({ preparationId })}
        >
          Start interview
        </Button>
      ) : null}
      {!balance.isPending && credits < 1 ? (
        <Button asChild>
          <Link href="/upgrade">Get credits</Link>
        </Button>
      ) : null}
    </div>
  );
}
