"use client";

import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { conversationTypes, preparationPacks, type ConversationType } from "../../types";

const typedCards = conversationTypes.filter((type) => type !== "custom");

interface Props {
  onChoose: (conversationType: ConversationType) => void;
}

export function ConversationTypeGrid({ onChoose }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {typedCards.map((type) => {
        const pack = preparationPacks[type];
        return (
          <button
            key={type}
            type="button"
            className={cn(
              "flex h-auto flex-col items-start gap-1 rounded-[24px] border bg-background px-5 py-5 text-left",
              "hover:bg-muted/60",
            )}
            onClick={() => onChoose(type)}
          >
            <span className="font-medium">{pack.label}</span>
            <span className="text-sm font-normal text-muted-foreground">{pack.description}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={cn(
          "flex h-auto flex-col items-start gap-1 rounded-[24px] border border-dashed bg-muted/50 px-5 py-5 text-left",
          "hover:bg-muted",
        )}
        onClick={() => onChoose("custom")}
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <PlusIcon className="size-4" />
          Custom conversation
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          {preparationPacks.custom.description}
        </span>
      </button>
    </div>
  );
}
