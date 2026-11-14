import { cn } from "@/lib/utils";

const chapters = [
  { id: "details", label: "Details" },
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

export function ChapterSpine({ current }: { current: ChapterId }) {
  const index = chapters.findIndex((chapter) => chapter.id === current);
  return (
    <ol className="flex w-full items-center text-sm">
      {chapters.map((chapter, position) => {
        const done = position < index;
        const active = position === index;
        const last = position === chapters.length - 1;
        return (
          <li key={chapter.id} className={cn("flex min-w-0 items-center", !last && "flex-1")}>
            <span
              className={cn(
                "inline-flex shrink-0 items-center",
                active ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground",
              )}
            >
              {chapter.label}
              {active ? <StageWave /> : null}
            </span>
            {last ? null : <span className="mx-4 h-px min-w-6 flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
