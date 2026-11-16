"use client";

import { CameraIcon, CameraOffIcon, MicIcon, MicOffIcon } from "lucide-react";
import {
  ParticipantView,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { cn } from "@/lib/utils";

export function CallUserTile() {
  const { useLocalParticipant, useMicrophoneState, useCameraState } = useCallStateHooks();
  const local = useLocalParticipant();
  const microphone = useMicrophoneState();
  const camera = useCameraState();
  const name = local?.name || "You";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const cameraOn = Boolean(local?.videoStream) && !camera.isMute;

  return (
    <div className="flex w-full max-w-[240px] flex-col items-center gap-3">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/30",
          local?.isSpeaking && "ring-1 ring-[#c4a07a]/50",
        )}
      >
        {cameraOn && local ? (
          <ParticipantView participant={local} muteAudio />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-medium tracking-tight">
            {initials || "You"}
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/50">
            {microphone.isMute ? (
              <MicOffIcon className="size-3.5" />
            ) : (
              <MicIcon className="size-3.5" />
            )}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/50">
            {cameraOn ? (
              <CameraIcon className="size-3.5" />
            ) : (
              <CameraOffIcon className="size-3.5" />
            )}
          </span>
        </div>
      </div>
      <p className="text-sm text-[var(--wiora-ash,#9a9488)]">{name}</p>
    </div>
  );
}
