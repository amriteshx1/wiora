"use client";

import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { WaitingButton } from "@/components/waiting-button";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { getPack, isRecentRunUpdate, preparationListLabels, type ConversationType, type DocumentSlot, type IntakeContext } from "../../types";
import { CustomForm } from "../forms/custom-form";
import { DifficultConversationForm } from "../forms/difficult-conversation-form";
import { InvestorPitchForm } from "../forms/investor-pitch-form";
import { JobInterviewForm } from "../forms/job-interview-form";
import { LeadershipForm } from "../forms/leadership-form";
import { NegotiationForm } from "../forms/negotiation-form";
import { SalesCallForm } from "../forms/sales-call-form";
import { SituationBrief } from "../components/situation-brief";
import { SessionCheckout } from "../components/session-checkout";
import { PreparationReport } from "../components/preparation-report";
import { ChapterSpine, type ChapterId } from "../components/chapter-spine";
import { ResearchScene } from "../components/research-scene";

interface Props {
  preparationId: string;
}

function asContext(value: unknown): IntakeContext {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntakeContext;
  }
  return {};
}

function isSituationModel(value: unknown): value is {
  knownFacts: string[];
  unknowns: string[];
  areas: {
    id: string;
    label: string;
    whyItMatters: string;
    priority: number;
    exitCriteria: string;
    documentAnchors: string[];
  }[];
  conversationStyle: {
    depth: string;
    skepticism: string;
    detail: string;
    pace: string;
    interruption: string;
    rationale: string;
  };
} {
  return Boolean(value && typeof value === "object" && "conversationStyle" in value && "areas" in value);
}

const forms = {
  job_interview: JobInterviewForm,
  investor_pitch: InvestorPitchForm,
  sales_call: SalesCallForm,
  negotiation: NegotiationForm,
  leadership: LeadershipForm,
  difficult_conversation: DifficultConversationForm,
  custom: CustomForm,
} as const;

function chapterFor(status: string, runStatus?: string, practicing?: boolean): ChapterId {
  if (status === "draft" || status === "failed") return "details";
  if (status === "processing") return "research";
  if (practicing) return "brief";
  if (runStatus === "processing") return "report";
  if (runStatus === "completed") return "report";
  if (runStatus === "paid" || runStatus === "active") return "interview";
  return "brief";
}

function timeEnded(hardEndAt: Date | string | null | undefined) {
  return Boolean(hardEndAt && new Date(hardEndAt).getTime() <= Date.now());
}

function intakeSummary(context: IntakeContext): string[] {
  return Object.entries(context)
    .filter(([key, value]) => typeof value === "string" && value.trim() && key !== "corrections")
    .slice(0, 6)
    .map(([, value]) => String(value).trim().slice(0, 140));
}

export const PreparationWorkspaceView = ({ preparationId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [practicing, setPracticing] = useState(false);
  const { data } = useSuspenseQuery({
    ...trpc.preparations.getOne.queryOptions({ id: preparationId }),
    refetchInterval: (query) => query.state.data?.status === "processing" ? 2000 : false,
  });
  const rerun = useMutation(trpc.preparations.rerun.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.preparations.getOne.queryOptions({ id: preparationId }));
    },
    onError: (error) => toast.error(error.message),
  }));
  const latest = useQuery({
    ...trpc.runs.getLatest.queryOptions({ preparationId }),
    refetchInterval: (query) => {
      const status = query.state.data?.latest?.status;
      return status === "processing" || status === "active" ? 2000 : false;
    },
  });
  const context = asContext(data.context);
  const pack = getPack(data.conversationType);
  const labels = preparationListLabels(data.conversationType, context);
  const documents = Array.isArray(context.documents) ? context.documents : [];
  const initialFiles = data.documents
    .filter((document) => document.status === "ready")
    .flatMap((document) => {
      const slot = documents.find((item) => item.id === document.id)?.slot;
      if (!slot) return [];
      return [{
        id: document.id,
        fileName: document.fileName,
        slot: slot as DocumentSlot,
      }];
    });

  if (!pack || !(data.conversationType in forms)) {
    return (
      <ErrorState
        title="Unknown preparation"
        description="This preparation type is not available"
      />
    );
  }

  const FormComponent = forms[data.conversationType as ConversationType];
  const live = latest.data?.latest;
  const completed = latest.data?.completed;
  const reportReady = Boolean(
    data.status === "ready"
    && completed?.status === "completed"
    && completed.report
    && typeof completed.report === "object",
  );
  const writingReport = Boolean(
    data.status === "ready"
    && !reportReady
    && (
      (live?.status === "processing" && isRecentRunUpdate(live.updatedAt))
      || (live?.status === "active" && timeEnded(live.hardEndAt))
    ),
  );
  const inLiveCall = live?.status === "active" && !timeEnded(live.hardEndAt);
  const showReport = reportReady && !practicing && !inLiveCall && !writingReport;
  const showBrief = Boolean(
    situationReady(data.status, data.situationModel)
    && data.status !== "processing"
    && (practicing || (!showReport && !writingReport)),
  );
  const current = chapterFor(
    data.status,
    writingReport ? "processing" : showReport ? "completed" : live?.status,
    practicing,
  );

  return (
    <div className="flex min-h-full w-full flex-col px-4 pb-10 md:px-8">
      <div className="space-y-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h5 className="text-xl font-medium">{labels.company}</h5>
            <p className="text-sm text-muted-foreground">{labels.role}</p>
          </div>
          {showReport ? (
            <Button type="button" className="shrink-0" onClick={() => setPracticing(true)}>
              Practice this again
            </Button>
          ) : practicing && reportReady ? (
            <Button type="button" variant="outline" className="shrink-0" onClick={() => setPracticing(false)}>
              Back to report
            </Button>
          ) : null}
        </div>
        <ChapterSpine current={current} />
      </div>

      {data.status === "processing" ? (
        <div className="rounded-2xl border bg-background p-6 md:p-8">
          <ResearchScene
            title={labels.company}
            processingStep={data.processingStep}
            documents={data.documents}
            summary={intakeSummary(context)}
          />
        </div>
      ) : null}

      {data.status === "failed" ? (
        <div className="space-y-4 rounded-2xl border bg-background p-6">
          <p className="text-sm">{data.error || "The brief could not be prepared"}</p>
          <WaitingButton
            type="button"
            waiting={rerun.isPending}
            idle="Try again"
            busy="Starting again"
            onClick={() => rerun.mutate({ id: data.id })}
          />
        </div>
      ) : null}

      {writingReport && !practicing ? (
        <div className="space-y-3 rounded-2xl border bg-background p-6 md:p-8">
          <h6 className="text-lg font-medium">Writing the report</h6>
          <p className="text-sm text-muted-foreground">
            The interview is over. This is written from what was said, not from the brief research.
          </p>
          <div className="h-px w-40 overflow-hidden bg-border">
            <div className="research-fill h-px w-full bg-foreground" />
          </div>
        </div>
      ) : null}

      {showReport ? (
        <PreparationReport
          runId={completed!.id}
          recordingUrl={completed!.recordingUrl}
          report={completed!.report as never}
        />
      ) : null}

      {showBrief ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-background">
          <div className="flex-1 p-6 md:p-8">
            <SituationBrief
              preparationId={data.id}
              conversationType={data.conversationType}
              context={context}
              model={data.situationModel as never}
              findings={data.findings}
              documents={data.documents.map((document) => ({
                id: document.id,
                fileName: document.fileName,
                status: document.status,
              }))}
            />
          </div>
          <div className="sticky bottom-0 border-t bg-background px-6 py-4">
            <SessionCheckout preparationId={data.id} />
          </div>
        </div>
      ) : null}

      {data.status === "draft" ? (
        <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-background p-6 md:p-8">
          <FormComponent
            preparationId={data.id}
            initialContext={context}
            initialFiles={initialFiles}
            onSaved={() => undefined}
          />
        </div>
      ) : null}
    </div>
  );
};

function situationReady(status: string, model: unknown) {
  return status === "ready" && isSituationModel(model);
}

export const PreparationWorkspaceLoading = () => {
  return (
    <LoadingState
      title="Loading preparation"
      description="Opening this conversation"
    />
  );
};

export const PreparationWorkspaceError = () => {
  return (
    <ErrorState
      title="Could not load this preparation"
      description="It may have been removed, or you may not have access"
    />
  );
};
