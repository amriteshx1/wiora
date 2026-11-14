import { useState } from "react";
import Link from "next/link";
import { ToggleAudioPreviewButton, useCallStateHooks } from "@stream-io/video-react-sdk";

import { Button } from "@/components/ui/button";
import { WaitingButton } from "@/components/waiting-button";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface Props {
    onJoin: () => void | Promise<void>;
    cancelHref: string;
}

export const CallLobby = ({ onJoin, cancelHref }: Props) => {
    const { useMicrophoneState } = useCallStateHooks();
    const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
    const [joining, setJoining] = useState(false);

    return (
        <div className="flex h-full flex-col items-center justify-center bg-background">
            <div className="flex w-full max-w-md flex-col gap-6 rounded-md border p-8">
                <div className="space-y-1">
                    <h6 className="text-lg font-medium">Join the interview</h6>
                    <p className="text-sm text-muted-foreground">This is a voice interview. Check the microphone, then sit across from the counterpart</p>
                </div>
                {hasMicPermission ? (
                    <p className="text-sm">Microphone is ready</p>
                ) : (
                    <p className="text-sm">Allow the microphone so you can speak</p>
                )}
                <ToggleAudioPreviewButton />
                <div className="flex justify-between gap-2">
                    <Button asChild variant="ghost">
                        <Link href={cancelHref}>Back to the brief</Link>
                    </Button>
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
