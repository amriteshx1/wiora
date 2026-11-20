"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ToggleAudioPreviewButton,
    ToggleVideoPreviewButton,
    VideoPreview,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { Button } from "@/components/ui/button";
import { WaitingButton } from "@/components/waiting-button";
import { cn } from "@/lib/utils";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface Props {
    onJoin: () => void | Promise<void>;
    cancelHref: string;
    embedded?: boolean;
}

export const CallLobby = ({ onJoin, cancelHref, embedded = false }: Props) => {
    const { useMicrophoneState, useCameraState } = useCallStateHooks();
    const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
    const { hasBrowserPermission: hasCameraPermission } = useCameraState();
    const [joining, setJoining] = useState(false);

    return (
        <div className={cn("flex h-full flex-col items-center justify-center bg-background", embedded ? "min-h-[28rem] px-4 py-10" : "")}>
            <div className="flex w-full max-w-lg flex-col gap-6 rounded-[24px] border bg-background p-8">
                <div className="space-y-1">
                    <h6 className="text-lg font-medium">Join the interview</h6>
                    <p className="text-sm text-muted-foreground">
                        Check the microphone and camera, then sit across from the counterpart
                    </p>
                </div>
                <div className="wiora-video-preview overflow-hidden rounded-[20px] border bg-muted">
                    <VideoPreview />
                </div>
                <div className="space-y-1 text-sm">
                    <p>{hasMicPermission ? "Microphone is ready" : "Allow the microphone so you can speak"}</p>
                    <p className="text-muted-foreground">
                        {hasCameraPermission
                            ? "Camera is available. Turn it on if you want to be seen"
                            : "Camera is optional. You can still join with voice"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ToggleAudioPreviewButton />
                    <ToggleVideoPreviewButton />
                </div>
                <div className="flex justify-between gap-2">
                    {embedded ? (
                        <p className="self-center text-sm text-muted-foreground">You stay on this preparation</p>
                    ) : (
                        <Button asChild variant="ghost">
                            <Link href={cancelHref}>Back to the brief</Link>
                        </Button>
                    )}
                    <WaitingButton
                      waiting={joining}
                      idle="Join the interview"
                      busy="Joining"
                      disabled={!hasMicPermission}
                      onClick={async () => {
                        setJoining(true);
                        try {
                          await onJoin();
                        } finally {
                          setJoining(false);
                        }
                      }}
                    />
                </div>
            </div>
        </div>
    );
};
