"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import Highlighter from "react-highlight-words";
import { useQuery } from "@tanstack/react-query";

import { LoadingState } from "@/components/loading-state";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/trpc/client";

interface Props {
  runId: string;
  focusTs?: number | null;
}

export function RunTranscript({ runId, focusTs }: Props) {
  const trpc = useTRPC();
  const { data, isPending } = useQuery(trpc.runs.getTranscript.queryOptions({ runId }));
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = (data ?? []).filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (focusTs == null) return;
    document.getElementById(`turn-${focusTs}`)?.scrollIntoView({ block: "center" });
  }, [focusTs, data]);

  if (isPending) {
    return (
      <div className="rounded-md border bg-background">
        <LoadingState title="Opening transcript" description="Loading what was said in this interview" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-4 rounded-md border bg-background px-4 py-5">
      <p className="text-sm font-medium">Transcript</p>
      <div className="relative">
        <Input
          placeholder="Search what was said"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-y-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing was captured from this interview</p>
          ) : null}
          {filtered.map((item) => (
            <div id={`turn-${item.startTs}`} key={`${item.startTs}-${item.text}`} className="flex flex-col gap-y-2 rounded-md border p-4">
              <div className="flex gap-x-2 items-center">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground font-medium tabular-nums">
                  {format(new Date(item.startTs), "mm:ss")}
                </p>
              </div>
              <Highlighter
                className="text-sm"
                highlightClassName="bg-muted"
                searchWords={[searchQuery]}
                autoEscape
                textToHighlight={item.text}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
