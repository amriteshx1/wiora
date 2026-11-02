"use client";

import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { getPack, type ConversationType, type DocumentSlot, type IntakeContext } from "../../types";
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

const stepCopy: Record<string, string> = {
  extracting: "Reading documents",
  researching: "Researching",
  synthesizing: "Preparing the brief",
};

const forms = {
  job_interview: JobInterviewForm,
  investor_pitch: InvestorPitchForm,
  sales_call: SalesCallForm,
  negotiation: NegotiationForm,
  leadership: LeadershipForm,
  difficult_conversation: DifficultConversationForm,
  custom: CustomForm,
} as const;

export const PreparationWorkspaceView = ({ preparationId }: Props) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
    refetchInterval: (query) => query.state.data?.status === "processing" ? 2000 : false,
  });
  const context = asContext(data.context);
  const pack = getPack(data.conversationType);
  const documents = Array.isArray(context.documents) ? context.documents : [];
  const initialFiles = data.documents
    .filter((document) => document.status === "ready")
    .flatMap((document) => {
      const slot = documents.find((item) => item.id === document.id)?.slot;
      if (!slot) {
        return [];
      }
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
        description="This preparation type is not available."
      />
    );
  }

  if (data.status === "processing") {
    return (
      <div className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-xl rounded-lg border bg-background p-6">
          <h5 className="text-xl font-medium">{data.title}</h5>
          <p className="mt-2 text-sm text-muted-foreground">
            {stepCopy[data.processingStep ?? ""] ?? "Preparing the brief"}
          </p>
        </div>
      </div>
    );
  }

  if (data.status === "failed") {
    return (
      <div className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-xl space-y-4 rounded-lg border bg-background p-6">
          <h5 className="text-xl font-medium">{data.title}</h5>
          <p className="text-sm">{data.error || "The brief could not be prepared."}</p>
          <Button type="button" disabled={rerun.isPending} onClick={() => rerun.mutate({ id: data.id })}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (data.status === "ready" && latest.data?.status === "processing") {
    return (
      <div className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-xl rounded-lg border bg-background p-6">
          <h5 className="text-xl font-medium">{data.title}</h5>
          <p className="mt-2 text-sm text-muted-foreground">The report is being written.</p>
        </div>
      </div>
    );
  }

  if (data.status === "ready" && latest.data?.status === "completed" && latest.data.report && typeof latest.data.report === "object") {
    return (
      <div className="flex-1 px-4 pb-10 md:px-8">
        <div className="py-4">
          <h5 className="font-medium text-xl">{data.title}</h5>
          <p className="mt-1 text-sm text-muted-foreground">{pack?.label}</p>
        </div>
        <PreparationReport
          runId={latest.data.id}
          recordingUrl={latest.data.recordingUrl}
          report={latest.data.report as never}
        />
      </div>
    );
  }

  if (data.status === "ready" && isSituationModel(data.situationModel)) {
    return (
      <div className="flex-1 px-4 pb-10 md:px-8">
        <div className="py-4">
          <h5 className="font-medium text-xl">{data.title}</h5>
          <p className="mt-1 text-sm text-muted-foreground">{pack.label}</p>
        </div>
        <div className="max-w-2xl rounded-lg border bg-background p-6">
          <SituationBrief
            preparationId={data.id}
            conversationType={data.conversationType}
            context={context}
            model={data.situationModel}
            findings={data.findings}
            documents={data.documents.map((document) => ({
              id: document.id,
              fileName: document.fileName,
              status: document.status,
            }))}
          />
          <SessionCheckout preparationId={data.id} />
        </div>
      </div>
    );
  }

  const FormComponent = forms[data.conversationType as ConversationType];

  return (
    <div className="flex-1 px-4 pb-10 md:px-8">
      <div className="py-4">
        <h5 className="font-medium text-xl">{data.title}</h5>
        <p className="mt-1 text-sm text-muted-foreground">{pack.label}</p>
      </div>
      <div className="max-w-2xl rounded-lg border bg-background p-6">
        <FormComponent
          preparationId={data.id}
          initialContext={context}
          initialFiles={initialFiles}
          onSaved={() => undefined}
        />
      </div>
    </div>
  );
};

export const PreparationWorkspaceLoading = () => {
  return (
    <LoadingState
      title="Loading preparation"
      description="This may take a few seconds"
    />
  );
};

export const PreparationWorkspaceError = () => {
  return (
    <ErrorState
      title="Could not load this preparation"
      description="It may have been removed, or you may not have access."
    />
  );
};
