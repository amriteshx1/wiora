import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const chapters = [
  { id: "details", label: "Details" },
  { id: "followups", label: "Follow-ups" },
  { id: "research", label: "Research" },
  { id: "brief", label: "Brief" },
  { id: "interview", label: "Interview" },
  { id: "report", label: "Report" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

function StageWave() {
  return (
    <svg className="ml-1.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4.5 6.2c.9.8.9 2.8 0 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7.5 4.4c1.6 1.4 1.6 5.8 0 7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 2.6c2.4 2 2.4 8.8 0 10.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ChapterHeader({
  title,
  subtitle,
  current,
  action,
}: {
  title: string;
  subtitle?: string | null;
  current: ChapterId;
  action?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
      <div className="space-y-4 px-4 py-5 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h5 className="text-xl font-medium">{title}</h5>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
        <ChapterSpine current={current} />
      </div>
    </div>
  );
}

export function ChapterSpine({ current }: { current: ChapterId }) {
  const index = chapters.findIndex((chapter) => chapter.id === current);
  return (
    <ol className="flex w-full items-center overflow-x-auto pb-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chapters.map((chapter, position) => {
        const done = position < index;
        const active = position === index;
        const last = position === chapters.length - 1;
        return (
          <li key={chapter.id} className={cn("flex min-w-0 items-center", !last && "flex-1")}>
            <span
              className={cn(
                "inline-flex shrink-0 items-center whitespace-nowrap",
                active ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground",
              )}
            >
              {chapter.label}
              {active ? <StageWave /> : null}
            </span>
            {last ? null : <span className="mx-3 h-px min-w-4 flex-1 bg-border md:mx-4" />}
          </li>
        );
      })}
    </ol>
  );
}
