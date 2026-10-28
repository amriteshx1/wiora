"use client";

import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

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

interface Props {
  preparationId: string;
}

function asContext(value: unknown): IntakeContext {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as IntakeContext;
  }
  return {};
}

function followUpsSubmitted(context: IntakeContext) {
  return context.followUpsSubmitted === true;
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

export const PreparationWorkspaceView = ({ preparationId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.preparations.getOne.queryOptions({ id: preparationId }),
  );
  const [saved, setSaved] = useState(false);
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

  if (saved || followUpsSubmitted(context) || data.status !== "draft") {
    return (
      <div className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-xl rounded-lg border bg-background p-6">
          <h5 className="text-xl font-medium">Preparation saved</h5>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.title} is saved as a draft. Research and the live session are not part of this step.
          </p>
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
          onSaved={() => setSaved(true)}
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
