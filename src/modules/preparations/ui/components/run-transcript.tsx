"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import Highlighter from "react-highlight-words";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/trpc/client";

interface Props {
  runId: string;
  focusTs?: number | null;
}

export function RunTranscript({ runId, focusTs }: Props) {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.runs.getTranscript.queryOptions({ runId }));
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = (data ?? []).filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (focusTs == null) return;
    document.getElementById(`turn-${focusTs}`)?.scrollIntoView({ block: "center" });
  }, [focusTs, data]);

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">Transcript</p>
      <div className="relative">
        <Input
          placeholder="Search Transcript"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-y-4">
          {filtered.map((item) => (
            <div id={`turn-${item.startTs}`} key={`${item.startTs}-${item.text}`} className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border">
              <div className="flex gap-x-2 items-center">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-sm text-blue-500 font-medium">
                  {format(new Date(item.startTs), "mm:ss")}
                </p>
              </div>
              <Highlighter
                className="text-sm text-neutral-700"
                highlightClassName="bg-yellow-200"
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
