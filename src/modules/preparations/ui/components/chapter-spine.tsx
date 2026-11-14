import { cn } from "@/lib/utils";

const chapters = [
  { id: "details", label: "Details" },
  { id: "research", label: "Research" },
  { id: "brief", label: "Brief" },
  { id: "interview", label: "Interview" },
  { id: "report", label: "Report" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

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
            <span className={cn("shrink-0", active ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground")}>
              {chapter.label}
            </span>
            {last ? null : <span className="mx-4 h-px min-w-6 flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
