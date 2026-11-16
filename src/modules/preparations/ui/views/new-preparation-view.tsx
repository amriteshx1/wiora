"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { conversationTypes, preparationPacks, type ConversationType } from "../../types";

const typedCards = conversationTypes.filter((type) => type !== "custom");

export const NewPreparationView = () => {
  const router = useRouter();

  const onChoose = (conversationType: ConversationType) => {
    router.push(`/preparations/new/${conversationType}`);
  };

  return (
    <div className="flex-1 px-4 pb-8 md:px-8">
      <div className="py-4">
        <h5 className="font-medium text-xl">New preparation</h5>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Pick the conversation you are preparing for. You can fill in the details on the next page
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {typedCards.map((type) => {
          const pack = preparationPacks[type];
          return (
            <button
              key={type}
              type="button"
              className={cn(
                "flex h-auto flex-col items-start gap-1 rounded-2xl border bg-background px-4 py-4 text-left",
                "hover:bg-muted/60",
              )}
              onClick={() => onChoose(type)}
            >
              <span className="font-medium">{pack.label}</span>
              <span className="text-sm font-normal text-muted-foreground">{pack.description}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-5"
          onClick={() => onChoose("custom")}
        >
          Custom conversation
        </Button>
      </div>
    </div>
  );
};
