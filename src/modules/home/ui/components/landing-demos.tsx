"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import {
  BookOpenTextIcon,
  BotIcon,
  CameraOffIcon,
  FileTextIcon,
  FileVideoIcon,
  GpuIcon,
  MicOffIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const AGENT_NAME = "Hiring manager";
const AGENT_INSTRUCTIONS =
  "You are a hiring manager running a first-round product interview. Ask follow-up questions, press on vague answers, and keep the conversation moving.";

function useTypedValue(text: string, active: boolean, speed = 36) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!active) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(text);
      return;
    }

    setValue("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setValue(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);

    return () => window.clearInterval(id);
  }, [active, speed, text]);

  return value;
}

export function DemoAgentForm({
  compact = false,
  animate = false,
  framed = false,
}: {
  compact?: boolean;
  animate?: boolean;
  framed?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const typedName = useTypedValue(AGENT_NAME, animate && inView);

  return (
    <form
      ref={ref}
      className={cn(
        "space-y-3",
        compact && "space-y-2",
        framed && "flex h-full flex-col justify-between space-y-0",
      )}
      onSubmit={(e) => e.preventDefault()}
    >
      <GeneratedAvatar
        seed="X"
        variant="botttsNeutral"
        className={cn(
          "border",
          compact ? "size-8" : "size-10",
          framed && "size-7",
        )}
      />
      <div className={cn("space-y-1.5", framed && "space-y-1")}>
        <Label className={cn(compact && "text-xs font-medium", framed && "text-[11px] font-medium")}>
          Agent Name
        </Label>
        <Input
          placeholder="e.g. Hiring manager"
          className={cn(
            compact && "h-6 text-xs placeholder:text-xs",
            framed && "h-7 placeholder:text-xs !text-xs md:!text-xs",
          )}
          {...(animate ? { value: typedName, readOnly: true } : {})}
        />
      </div>
      <div className={cn("space-y-1.5", framed && "flex min-h-0 flex-1 flex-col space-y-1")}>
        <Label className={cn(compact && "text-xs font-medium", framed && "text-[11px] font-medium")}>
          Instructions
        </Label>
        <Textarea
          className={cn(
            compact && "h-16 max-h-16 resize-none text-xs placeholder:text-xs [field-sizing:fixed]",
            framed &&
              "min-h-16 max-h-20 flex-1 resize-none leading-relaxed placeholder:text-xs [field-sizing:fixed] !text-xs md:!text-xs",
          )}
          placeholder={AGENT_INSTRUCTIONS}
          {...(animate ? { value: AGENT_INSTRUCTIONS, readOnly: true } : {})}
        />
      </div>
      <div className={cn("flex justify-between gap-x-2", framed && "mt-2")}>
        <Button
          variant="ghost"
          type="button"
          className={cn(compact && "h-6 p-0 text-xs", framed && "h-7 px-2 text-xs")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className={cn(compact && "h-6 px-2 text-xs", framed && "h-7 px-3 text-xs")}
        >
          Create
        </Button>
      </div>
    </form>
  );
}

export function DemoMeetingForm({
  compact = false,
  framed = false,
}: {
  compact?: boolean;
  framed?: boolean;
}) {
  return (
    <form
      className={cn(
        "space-y-3",
        compact && "space-y-2",
        framed && "flex h-full flex-col justify-between space-y-0",
      )}
      onSubmit={(e) => e.preventDefault()}
    >
      <GpuIcon size={framed ? 22 : compact ? 28 : 30} color="#141414" />
      <div className={cn("space-y-1.5", framed && "space-y-1")}>
        <Label className={cn(compact && "text-xs font-medium", framed && "text-[11px] font-medium")}>
          Meeting Name
        </Label>
        <Input
          placeholder="e.g. Interview practice"
          className={cn(
            compact && "h-6 text-xs placeholder:text-xs",
            framed && "h-7 placeholder:text-xs !text-xs md:!text-xs",
          )}
        />
      </div>
      <div className={cn("space-y-1.5", framed && "space-y-1")}>
        <Label className={cn(compact && "text-xs font-medium", framed && "text-[11px] font-medium")}>
          Agent
        </Label>
        <CommandSelect
          options={[
            {
              id: "demo-agent",
              value: "demo-agent",
              children: (
                <span className="flex items-center gap-1.5">
                  <GeneratedAvatar
                    seed="X"
                    variant="botttsNeutral"
                    className={cn("border", framed ? "size-4" : "size-5")}
                  />
                  Hiring manager
                </span>
              ),
            },
          ]}
          value="demo-agent"
          onSelect={() => {}}
          onSearch={() => {}}
          placeholder="Select an agent"
          className={cn(
            "pointer-events-none",
            framed && "h-7 px-2 text-xs [&_svg]:size-3.5",
          )}
        />
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "lg:text-sm text-xs" : "text-sm",
            framed && "text-[11px] leading-snug",
          )}
        >
          Not found what you&apos;re looking for?{" "}
          <button type="button" className="text-primary hover:underline">
            Create a new agent
          </button>
        </p>
      </div>
      <div className="flex justify-between gap-x-2">
        <Button
          variant="ghost"
          type="button"
          className={cn(compact && "h-0 px-2 text-xs", framed && "h-7 px-2 text-xs")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className={cn(compact && "h-6 px-2 text-xs", framed && "h-7 px-3 text-xs")}
        >
          Create
        </Button>
      </div>
    </form>
  );
}

export function DemoCall({ live = false }: { live?: boolean }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      {live ? (
        <div className="flex w-full items-center justify-between text-[11px] text-[var(--wiora-mute)]">
          <span>Interview practice</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-black" />
            Live
          </span>
        </div>
      ) : null}
      <div className="flex h-[140px] w-[80%] flex-col items-center justify-center gap-1 border border-neutral-300 bg-[var(--wiora-mist)]">
        <BotIcon
          size={32}
          strokeWidth={1}
          className="rounded-full border border-neutral-800 p-1"
        />
        <p className="text-xs font-light">Hiring Manager Agent</p>
      </div>
      <div className="flex items-center justify-center border border-neutral-200">
        <div className="flex h-14 w-[10vh] min-w-[88px] flex-col items-center justify-center gap-0 border border-neutral-300">
          <UserRoundIcon
            size={16}
            strokeWidth={1}
            className="rounded-full border border-neutral-800 p-0.5"
          />
          <p className="text-[10px] font-light">You</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 text-[var(--wiora-ink)]">
        <CameraOffIcon size={14} strokeWidth={1} />
        <MicOffIcon size={14} strokeWidth={1} />
        <Button type="button" className="h-4 bg-red-600 px-1 text-[10px] text-white">
          End
        </Button>
      </div>
    </div>
  );
}

export function DemoPostCall() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-[var(--wiora-rule)] pb-2 text-[11px] text-[var(--wiora-mute)]">
        <span className="border-b border-[#1a1714] pb-2 text-[#1a1714]">Summary</span>
        <span className="pb-2">Transcript</span>
        <span className="pb-2">Recording</span>
        <span className="pb-2">Ask AI</span>
      </div>
      <div className="flex flex-wrap items-center">
        <div className="flex w-1/2 flex-col items-center justify-center border p-6">
          <BookOpenTextIcon size={18} strokeWidth={1} />
          <p className="text-xs font-normal">Summary</p>
        </div>
        <div className="flex w-1/2 flex-col items-center justify-center border p-6">
          <FileTextIcon size={18} strokeWidth={1} />
          <p className="text-xs font-normal">Transcript</p>
        </div>
        <div className="flex w-1/2 flex-col items-center justify-center border p-6">
          <FileVideoIcon size={18} strokeWidth={1} />
          <p className="text-xs font-normal">Recording</p>
        </div>
        <div className="flex w-1/2 flex-col items-center justify-center border p-6">
          <SparklesIcon size={18} strokeWidth={1} />
          <p className="text-xs font-normal">Ask AI</p>
        </div>
      </div>
    </div>
  );
}
