"use client";

import { preparationPacks, type ConversationType } from "../../types";
import { IntakeForm } from "../forms/intake-form";

interface Props {
  conversationType: ConversationType;
}

export const NewPreparationDetailsView = ({ conversationType }: Props) => {
  const pack = preparationPacks[conversationType];

  return (
    <div className="flex-1 px-4 pb-10 md:px-8">
      <div className="py-6">
        <h5 className="text-xl font-medium">{pack.label}</h5>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{pack.description}</p>
      </div>
      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-background p-6 md:p-8">
        <IntakeForm
          packId={conversationType}
          initialContext={{}}
          initialFiles={[]}
          onSaved={() => undefined}
        />
      </div>
    </div>
  );
};
