"use client";

import { useState } from "react";

import { preparationPacks, type ConversationType } from "../../types";
import { ChapterHeader, type ChapterId } from "../components/chapter-spine";
import { IntakeForm } from "../forms/intake-form";

interface Props {
  conversationType: ConversationType;
}

export const NewPreparationDetailsView = ({ conversationType }: Props) => {
  const pack = preparationPacks[conversationType];
  const [stage, setStage] = useState<Extract<ChapterId, "details" | "followups">>("details");

  return (
    <div className="flex min-h-full w-full flex-col">
      <ChapterHeader
        title={pack.label}
        subtitle={pack.description}
        current={stage}
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="rounded-[24px] border bg-background p-6 md:p-8">
          <IntakeForm
            packId={conversationType}
            initialContext={{}}
            initialFiles={[]}
            onSaved={() => undefined}
            onStageChange={setStage}
          />
        </div>
      </div>
    </div>
  );
};
