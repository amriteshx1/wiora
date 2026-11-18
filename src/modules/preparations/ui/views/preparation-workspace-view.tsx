"use client";

import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { WaitingButton } from "@/components/waiting-button";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { CallProvider } from "@/modules/call/ui/components/call-provider";
import { useTRPC } from "@/trpc/client";

import { getPack, isRecentRunUpdate, preparationListLabels, type ConversationType, type DocumentSlot, type IntakeContext } from "../../types";
import { CustomForm } from "../forms/custom-form";
import { CustomerEscalationForm } from "../forms/customer-escalation-form";
import { DifficultConversationForm } from "../forms/difficult-conversation-form";
import { InvestorPitchForm } from "../forms/investor-pitch-form";
import { JobInterviewForm } from "../forms/job-interview-form";
import { LeadershipForm } from "../forms/leadership-form";
import { MediaInterviewForm } from "../forms/media-interview-form";
import { NegotiationForm } from "../forms/negotiation-form";
import { NetworkingConversationForm } from "../forms/networking-conversation-form";
import { PartnershipMeetingForm } from "../forms/partnership-meeting-form";
import { PerformanceReviewForm } from "../forms/performance-review-form";
import { SalaryNegotiationForm } from "../forms/salary-negotiation-form";
import { SalesCallForm } from "../forms/sales-call-form";
import { SituationBrief } from "../components/situation-brief";
import { SessionCheckout } from "../components/session-checkout";
import { PreparationReport } from "../components/preparation-report";
import { ChapterHeader, type ChapterId } from "../components/chapter-spine";
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
  performance_review: PerformanceReviewForm,
  customer_escalation: CustomerEscalationForm,
  partnership_meeting: PartnershipMeetingForm,
  media_interview: MediaInterviewForm,
  salary_negotiation: SalaryNegotiationForm,
  networking_conversation: NetworkingConversationForm,
  custom: CustomForm,
} as const;

function chapterFor(args: {
  status: string;
  runStatus?: string;
  practicing?: boolean;
  followups?: boolean;
  stayOnInterview?: boolean;
}): ChapterId {
  if (args.status === "draft" || args.status === "failed") {
    return args.followups ? "followups" : "details";
  }
  if (args.status === "processing") return "research";
  if (args.stayOnInterview) return "interview";
  if (args.practicing) return "brief";
  if (args.runStatus === "processing") return "report";
  if (args.runStatus === "completed") return "report";
  if (args.runStatus === "paid" || args.runStatus === "active") return "interview";
  return "brief";
}

function timeEnded(hardEndAt: Date | string | null | undefined) {
  return Boolean(hardEndAt && new Date(hardEndAt).getTime() <= Date.now());
}

function clippedDetail(value: string, limit: number): string {
  const text = value.trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}...`;
}

function intakeSummary(context: IntakeContext, conversationType: string): string[] {
  const pack = getPack(conversationType);
  const rows = (pack?.fields ?? []).flatMap((field) => {
    const value = context[field.name];
    if (typeof value !== "string" || !value.trim()) return [];
    return [`${field.label}: ${clippedDetail(value, 160)}`];
  });
  if (rows.length > 0) return rows.slice(0, 8);
  return Object.entries(context)
    .filter(([key, value]) => typeof value === "string" && value.trim() && key !== "corrections")
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${clippedDetail(String(value), 140)}`);
}

export const PreparationWorkspaceView = ({ preparationId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [practicing, setPracticing] = useState(false);
  const [intakeStage, setIntakeStage] = useState<"details" | "followups">("details");
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [proceedToReport, setProceedToReport] = useState(false);
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
  const joinable = Boolean(
    live && (live.status === "paid" || inLiveCall) && !interviewEnded,
  );
  const stayOnInterview = interviewEnded && !proceedToReport;
  const showInterview = joinable || stayOnInterview;
  const showReport = reportReady && !practicing && !showInterview;
  const showWriting = Boolean(
    !practicing
    && !showInterview
    && !showReport
    && (writingReport || proceedToReport),
  );
  const showBrief = Boolean(
    situationReady(data.status, data.situationModel)
    && data.status !== "processing"
    && !showInterview
    && !showWriting
    && (practicing || !showReport),
  );
  const current = chapterFor({
    status: data.status,
    runStatus: showWriting ? "processing" : showReport ? "completed" : live?.status,
    practicing,
    followups: intakeStage === "followups",
    stayOnInterview: showInterview,
  });

  const openInterview = () => {
    setPracticing(false);
    setInterviewEnded(false);
    setProceedToReport(false);
  };

  const headerAction = showReport ? (
    <Button type="button" className="shrink-0" onClick={() => {
      setPracticing(true);
      setInterviewEnded(false);
      setProceedToReport(false);
    }}>
      Practice this again
    </Button>
  ) : practicing && reportReady ? (
    <Button type="button" variant="outline" className="shrink-0" onClick={() => setPracticing(false)}>
      Back to report
    </Button>
  ) : null;

  return (
    <div className="flex min-h-full w-full flex-col">
      <ChapterHeader
        title={labels.company}
        subtitle={labels.role}
        current={current}
        action={headerAction}
      />

      <div className="flex-1 px-4 py-8 md:px-8">
        {data.status === "processing" ? (
          <ResearchScene
            title={labels.company}
            processingStep={data.processingStep}
            documents={data.documents}
            summary={intakeSummary(context, data.conversationType)}
          />
        ) : null}

        {data.status === "failed" ? (
          <div className="space-y-4 rounded-[24px] border bg-background p-6">
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

        {showWriting ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-[24px] border bg-background px-6 py-16 text-center">
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
          <div className="flex flex-1 flex-col overflow-hidden rounded-[24px] border bg-background">
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
              <SessionCheckout preparationId={data.id} onStarted={openInterview} />
            </div>
          </div>
        ) : null}

        {showInterview && stayOnInterview ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[24px] border bg-background px-6 py-16 text-center">
            <h6 className="text-lg font-medium">The interview has ended</h6>
            <p className="text-sm text-muted-foreground">
              The report is being written from what was said. Continue when you are ready to read it.
            </p>
            <Button type="button" onClick={() => setProceedToReport(true)}>
              Proceed with reports
            </Button>
          </div>
        ) : null}

        {showInterview && joinable && live ? (
          <div className="overflow-hidden">
            <CallProvider
              meetingId={live.id}
              meetingName={live.counterpartName || "Practice"}
              tokenSource="run"
              endedHref={`/preparations/${data.id}`}
              endedDetail="The report is being written on this preparation"
              hardEndAt={live.hardEndAt ? new Date(live.hardEndAt).toISOString() : null}
              layout="embed"
              onEnded={() => {
                setInterviewEnded(true);
                void queryClient.invalidateQueries(trpc.runs.getLatest.queryOptions({ preparationId }));
              }}
            />
          </div>
        ) : null}

        {data.status === "draft" ? (
          <div className="mx-auto w-full max-w-2xl rounded-[24px] border bg-background p-6 md:p-8">
            <FormComponent
              preparationId={data.id}
              initialContext={context}
              initialFiles={initialFiles}
              onSaved={() => undefined}
              onStageChange={setIntakeStage}
            />
          </div>
        ) : null}
      </div>
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
