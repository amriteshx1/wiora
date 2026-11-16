"use client";

import { MicIcon, MicOffIcon } from "lucide-react";
import {
  ParticipantView,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { cn } from "@/lib/utils";

export function CallUserTile() {
  const { useLocalParticipant, useMicrophoneState } = useCallStateHooks();
  const local = useLocalParticipant();
  const microphone = useMicrophoneState();
  const name = local?.name || "You";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const cameraOn = Boolean(local?.videoStream);

  return (
    <div className="flex w-full max-w-[220px] flex-col items-center gap-3">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted",
          local?.isSpeaking && "ring-1 ring-foreground/30",
        )}
      >
        {cameraOn && local ? (
          <ParticipantView participant={local} />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-medium tracking-tight">
            {initials || "You"}
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex size-8 items-center justify-center rounded-full border bg-background/90">
          {microphone.isMute ? (
            <MicOffIcon className="size-3.5" />
          ) : (
            <MicIcon className="size-3.5" />
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{name}</p>
    </div>
  );
}
