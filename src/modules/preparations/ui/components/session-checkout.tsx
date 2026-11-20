"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WaitingButton } from "@/components/waiting-button";
import { useTRPC } from "@/trpc/client";

interface Props {
  preparationId: string;
  onStarted?: (runId: string) => void;
}

export function SessionCheckout({ preparationId, onStarted }: Props) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const balance = useQuery(trpc.premium.getBalance.queryOptions());
  const latest = useQuery({
    ...trpc.runs.getLatest.queryOptions({ preparationId }),
    refetchInterval: (query) => query.state.data?.latest?.status === "processing" ? 2000 : false,
  });
  const start = useMutation(trpc.runs.startInterview.mutationOptions({
    onSuccess: async (result) => {
      if (result.needsCredits) {
        router.push("/upgrade");
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries(trpc.runs.getLatest.queryOptions({ preparationId })),
        queryClient.invalidateQueries(trpc.premium.getBalance.queryOptions()),
      ]);
      if (result.runId) onStarted?.(result.runId);
    },
    onError: (error) => toast.error(error.message),
  }));

  const run = latest.data?.latest;
  const credits = balance.data?.balance ?? 0;

  if (run?.status === "paid" || run?.status === "active") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">The counterpart is ready</p>
        <Button type="button" className="shrink-0" onClick={() => onStarted?.(run.id)}>
          Continue interview
        </Button>
      </div>
    );
  }

  if (run?.status === "processing") {
    return (
      <p className="text-sm text-muted-foreground">The report is being written</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm">One credit starts one 30-minute interview</p>
        <p className="text-sm text-muted-foreground">
          {balance.isPending
            ? "Checking credits"
            : `You have ${credits} ${credits === 1 ? "credit" : "credits"}`}
          {run?.status === "failed" ? " · The last interview did not start" : ""}
        </p>
      </div>
      {!balance.isPending && credits > 0 ? (
        <WaitingButton
          type="button"
          className="shrink-0"
          waiting={start.isPending}
          idle="Start interview"
          busy="Starting"
          onClick={() => start.mutate({ preparationId })}
        />
      ) : null}
      {!balance.isPending && credits < 1 ? (
        <Button asChild className="shrink-0">
          <Link href="/upgrade">Get credits</Link>
        </Button>
      ) : null}
    </div>
  );
}
