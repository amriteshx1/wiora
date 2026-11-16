"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CancelCallButton,
    ParticipantsAudio,
    ToggleAudioPublishingButton,
    ToggleVideoPublishingButton,
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
    const { useLocalParticipant, useParticipants, useRemoteParticipants } = useCallStateHooks();
    const local = useLocalParticipant();
    const participants = useParticipants();
    const remotes = useRemoteParticipants();
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
        <div className="wiora-interview wiora-call fixed inset-0 z-[80] flex h-svh flex-col">
            <ParticipantsAudio participants={remotes} />
            <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-10">
                <div>
                    <p className="text-xs text-[var(--wiora-ash,#9a9488)]">Live session</p>
                    <h4 className="mt-1 text-lg font-medium tracking-tight">{meetingName}</h4>
                </div>
                {hardEndAt ? (
                    <p className="rounded-full border border-white/10 px-4 py-1.5 text-sm tabular-nums tracking-[0.18em]">
                        {clock}
                    </p>
                ) : null}
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 px-6 pb-4 md:px-10 lg:grid-cols-[minmax(220px,320px)_minmax(0,1fr)_minmax(180px,240px)] lg:items-center">
                <div className="flex items-center justify-center py-4">
                    <MatrixOrb
                        state={orbState}
                        level={userSpeaking ? Math.max(level, 0.28) : undefined}
                        size={320}
                        color="#c4a07a"
                    />
                </div>
                <CallChat
                    runId={runId}
                    userSpeaking={userSpeaking}
                    counterpartSpeaking={counterpartSpeaking}
                    userName={userName}
                    counterpartName={meetingName}
                />
                <div className="flex items-center justify-center py-4">
                    <CallUserTile />
                </div>
            </div>
            <div className="border-t border-white/10 bg-black/25">
                <div className="flex items-center justify-center gap-3 px-6 py-5">
                    <ToggleAudioPublishingButton />
                    <ToggleVideoPublishingButton />
                    <CancelCallButton onLeave={onLeave} />
                </div>
            </div>
        </div>
    );
};
