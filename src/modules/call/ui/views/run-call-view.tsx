"use client";

import Link from "next/link";

import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

import { CallProvider } from "../components/call-provider";

interface Props {
  runId: string;
}

function timeEnded(hardEndAt: Date | string | null) {
  return Boolean(hardEndAt && new Date(hardEndAt).getTime() <= Date.now());
}

export const RunCallView = ({ runId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.runs.getOne.queryOptions({ runId }));
  const backHref = `/preparations/${data.preparationId}`;

  if (data.status === "processing" || data.status === "completed" || timeEnded(data.hardEndAt)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <ErrorState
          title={data.status === "completed" ? "This interview has ended" : "The interview has ended"}
          description="The report is on this preparation"
        />
        <Button asChild>
          <Link href={backHref}>Back to report</Link>
        </Button>
      </div>
    );
  }

  if (data.status !== "paid" && data.status !== "active") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <ErrorState
          title="This interview has not started"
          description="Go back to the preparation and start it from the brief"
        />
        <Button asChild variant="outline">
          <Link href={backHref}>Open the preparation</Link>
        </Button>
      </div>
    );
  }

  return (
    <CallProvider
      meetingId={data.id}
      meetingName={data.counterpartName || "Practice"}
      tokenSource="run"
      endedHref={backHref}
      endedDetail="The report is being written on this preparation"
      hardEndAt={data.hardEndAt ? new Date(data.hardEndAt).toISOString() : null}
    />
  );
};
