"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
    runId: string;
    meetingName: string;
    endedHref: string;
    endedDetail: string;
    hardEndAt?: string | null;
    layout?: "page" | "embed";
    onEnded?: () => void;
}

export const CallUI = ({
    runId,
    meetingName,
    endedHref,
    endedDetail,
    hardEndAt,
    layout = "page",
    onEnded,
}: Props) => {
    const call = useCall();
    const trpc = useTRPC();
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
    const { mutate: finishRun } = useMutation(trpc.runs.finish.mutationOptions());
    const { mutateAsync: beginRun } = useMutation(trpc.runs.begin.mutationOptions());
    const finishRef = useRef(finishRun);
    finishRef.current = finishRun;
    const endedRef = useRef(false);

    const closeInterview = useCallback(() => {
        if (endedRef.current) return;
        endedRef.current = true;
        finishRef.current({ runId });
        setShow("ended");
        onEnded?.();
    }, [onEnded, runId]);

    const handleJoin = async () => {
        if(!call) return;

        call.speaker.setVolume(1);
        await call.join();
        try {
            await beginRun({ runId });
        } catch (error) {
            await call.leave().catch(() => undefined);
            toast.error(error instanceof Error ? error.message : "The interview could not be started");
            return;
        }

        setShow("call");
    };

    const handleLeave = () => {
        if(!call) return;

        call.endCall();
        closeInterview();
    };

    useEffect(() => {
      if (!call) return;
  
      const unsubscribe = call.on("callEnded", () => {
        closeInterview();
      });
  
      return () => {
        unsubscribe?.();
      };
    }, [call, closeInterview]);

    return (
        <StreamTheme className="h-full">
            {show === "lobby" && <CallLobby onJoin={handleJoin} cancelHref={endedHref} embedded={layout === "embed"} />}
            {show === "call" && (
              <CallActive onLeave={handleLeave} meetingName={meetingName} hardEndAt={hardEndAt} backHref={endedHref} runId={runId} />
            )}
            {show === "ended" && layout === "page" && (
              <CallEnded href={endedHref} detail={endedDetail} counterpartName={meetingName} />
            )}
        </StreamTheme>
    );
};
