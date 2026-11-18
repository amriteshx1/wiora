"use client";

import { ArrowUpRight, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { conversationTypes, preparationPacks, type ConversationType } from "../../types";

const typedCards = conversationTypes.filter((type) => type !== "custom");

interface Props {
  onChoose: (conversationType: ConversationType) => void;
}

const cardClass =
  "flex h-auto flex-col items-start gap-1 rounded-[24px] border bg-background px-5 py-5 text-left hover:bg-muted/60";

export function ConversationTypeGrid({ onChoose }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {typedCards.map((type) => {
        const pack = preparationPacks[type];
        return (
          <button
            key={type}
            type="button"
            className={cardClass}
            onClick={() => onChoose(type)}
          >
            <span className="font-medium">{pack.label}</span>
            <span className="text-sm font-normal text-muted-foreground">{pack.description}</span>
          </button>
        );
      })}
      <div className="flex justify-center md:col-span-2 xl:col-span-3">
        <button
          type="button"
          className={cn(
            cardClass,
            "w-full items-center border-dashed text-center",
            "md:w-[calc((100%-0.75rem)/2+0.75rem)]",
            "xl:w-[calc(2*((100%-1.5rem)/3)+1.5rem)]",
          )}
          onClick={() => onChoose("custom")}
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <PlusIcon className="size-4" />
            Create your own
            <ArrowUpRight className="size-4" />
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            A conversation that doesn't fit the usual categories.
          </span>
        </button>
      </div>
    </div>
  );
}
