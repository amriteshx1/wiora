"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";

import { CallProvider } from "../components/call-provider";

interface Props {
  runId: string;
}

function canJoin(status: string, hardEndAt: Date | string | null, startedAt: Date | string | null) {
  if (status !== "paid" && status !== "active") return false;
  if (status === "paid" && startedAt == null) return true;
  if (hardEndAt && new Date(hardEndAt).getTime() <= Date.now()) return false;
  return true;
}

export const RunCallView = ({ runId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.runs.getOne.queryOptions({ runId }));

  if (!canJoin(data.status, data.hardEndAt, data.startedAt)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="This session cannot be joined"
          description="It has not been paid, or the paid time has ended."
        />
      </div>
    );
  }

  return (
    <CallProvider
      meetingId={data.id}
      meetingName={data.counterpartName || "Practice"}
      tokenSource="run"
      endedHref={`/preparations/${data.preparationId}`}
      endedDetail="The report will appear on your preparation."
      hardEndAt={data.hardEndAt ? new Date(data.hardEndAt).toISOString() : null}
    />
  );
};
