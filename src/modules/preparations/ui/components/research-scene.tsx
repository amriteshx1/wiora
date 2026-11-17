"use client";

import { cn } from "@/lib/utils";

const nodes = [
  { id: "extracting", label: "Reading documents", detail: "Pulling facts from the files you added" },
  { id: "researching", label: "Researching", detail: "Looking up the other side in public sources" },
  { id: "synthesizing", label: "Preparing the brief", detail: "Turning what we found into the interview plan" },
] as const;

function rank(step: string | null | undefined): number {
  if (step === "extracting") return 0;
  if (step === "researching") return 1;
  if (step === "synthesizing") return 2;
  return 0;
}

interface Props {
  title: string;
  processingStep: string | null;
  documents: Array<{ fileName: string; status: string }>;
  summary?: string[];
}

export function ResearchScene({ title, processingStep, documents, summary }: Props) {
  const current = rank(processingStep);
  const readyFiles = documents.filter((document) => document.status === "ready");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <aside className="space-y-5 rounded-[24px] bg-muted/70 p-6 md:p-8">
        <div>
          <p className="text-sm text-muted-foreground">In progress</p>
          <h6 className="mt-1 text-lg font-medium tracking-tight">{title}</h6>
        </div>
        {summary && summary.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">From the details</p>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {summary.slice(0, 8).map((item) => (
                <li key={item} className="break-words">{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {readyFiles.length > 0 ? (
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Files</p>
            <ul className="list-disc space-y-1 pl-5">
              {readyFiles.map((document) => (
                <li key={document.fileName} className="break-words">{document.fileName}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
      <ol className="space-y-0 rounded-[24px] border bg-background p-6 md:p-8">
        {nodes.map((node, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={node.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 size-2 rounded-full",
                    active || done ? "bg-foreground" : "bg-border",
                  )}
                />
                {index < nodes.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
              </div>
              <div className={cn("pb-8", index === nodes.length - 1 && "pb-0")}>
                <p className={cn("font-medium", !active && !done && "text-muted-foreground")}>
                  {node.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active && readyFiles[0] && node.id === "extracting"
                    ? `Reading ${readyFiles[0].fileName}`
                    : node.detail}
                </p>
                {active ? (
                  <div className="mt-3 h-px w-40 overflow-hidden bg-border">
                    <div className="research-fill h-px w-full bg-foreground" />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
