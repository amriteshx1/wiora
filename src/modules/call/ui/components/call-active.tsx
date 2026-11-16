import { useEffect, useMemo, useState } from "react";
import {
    CancelCallButton,
    ToggleAudioPublishingButton,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { CallChat } from "./call-chat";
import { CallUserTile } from "./call-user-tile";
import MatrixOrb, { type MatrixOrbState } from "./matrix-orb";

interface Props {
    onLeave: () => void;
    meetingName: string;
    hardEndAt?: string | null;
    backHref: string;
    runId: string;
}

function remainingLabel(hardEndAt: string): string {
    const remaining = Math.max(0, new Date(hardEndAt).getTime() - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const CallActive = ({ onLeave, meetingName, hardEndAt, runId }: Props) => {
    const [clock, setClock] = useState(hardEndAt ? remainingLabel(hardEndAt) : "");
    const { useLocalParticipant, useParticipants } = useCallStateHooks();
    const local = useLocalParticipant();
    const participants = useParticipants();
    const counterpart = useMemo(
        () => participants.find((participant) => !participant.isLocalParticipant),
        [participants],
    );
    const userSpeaking = Boolean(local?.isSpeaking);
    const counterpartSpeaking = Boolean(counterpart?.isSpeaking);
    const userName = local?.name || "You";
    const level = Math.min(1, Math.max(0, local?.audioLevel ?? 0));
    const orbState: MatrixOrbState = userSpeaking
        ? "listening"
        : counterpartSpeaking
          ? "thinking"
          : "idle";

    useEffect(() => {
        if (!hardEndAt) return;
        const timer = setInterval(() => {
            setClock(remainingLabel(hardEndAt));
        }, 1000);
        return () => clearInterval(timer);
    }, [hardEndAt]);

    return (
        <div className="wiora-call flex h-full flex-col bg-background text-foreground">
            <header className="flex items-center justify-between gap-4 px-6 py-4">
                <h4 className="text-base font-medium">{meetingName}</h4>
                {hardEndAt ? <p className="text-sm tabular-nums text-muted-foreground">{clock}</p> : null}
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-6 pb-2 lg:grid-cols-[minmax(180px,240px)_minmax(0,1fr)_minmax(160px,220px)]">
                <div className="flex items-center justify-center">
                    <MatrixOrb state={orbState} level={userSpeaking ? Math.max(level, 0.28) : undefined} size={220} />
                </div>
                <CallChat
                    runId={runId}
                    userSpeaking={userSpeaking}
                    counterpartSpeaking={counterpartSpeaking}
                    userName={userName}
                    counterpartName={meetingName}
                />
                <div className="flex items-center justify-center">
                    <CallUserTile />
                </div>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-5">
                <ToggleAudioPublishingButton />
                <CancelCallButton onLeave={onLeave} />
            </div>
        </div>
    );
};
