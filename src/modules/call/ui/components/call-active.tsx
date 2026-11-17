"use client";

import { useMemo } from "react";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from "lucide-react";
import {
    CancelCallButton,
    ParticipantsAudio,
    useCall,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { CallChat } from "./call-chat";
import { CallCountdown } from "./call-countdown";
import { CallUserTile } from "./call-user-tile";
import MatrixOrb, { type MatrixOrbState } from "./matrix-orb";

interface Props {
    onLeave: () => void;
    meetingName: string;
    hardEndAt?: string | null;
    backHref: string;
    runId: string;
}

export const CallActive = ({ onLeave, meetingName, hardEndAt, runId }: Props) => {
    const joinedFallback = useMemo(
        () => Date.now() + 30 * 60 * 1000,
        [],
    );
    const endsAt = hardEndAt ? new Date(hardEndAt).getTime() : joinedFallback;
    const call = useCall();
    const { useLocalParticipant, useParticipants, useRemoteParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
    const microphone = useMicrophoneState();
    const camera = useCameraState();
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

    return (
        <div className="wiora-interview wiora-call fixed inset-0 z-[80] flex h-svh flex-col">
            <ParticipantsAudio participants={remotes} />
            <header className="flex items-center justify-between gap-4 px-6 py-5 md:px-10">
                <div>
                    <p className="text-xs text-white/45">Live session</p>
                    <h4 className="mt-1 text-lg font-medium tracking-tight">{meetingName}</h4>
                </div>
                <CallCountdown endsAt={endsAt} />
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 px-6 pb-2 pt-6 md:px-10 lg:grid-cols-[minmax(220px,368px)_minmax(0,1fr)_minmax(180px,240px)] lg:items-center">
                <div className="flex items-center justify-center py-2">
                    <MatrixOrb
                        state={orbState}
                        level={userSpeaking ? Math.max(level, 0.28) : undefined}
                        size={368}
                        color="#f5f5f4"
                    />
                </div>
                <CallChat
                    runId={runId}
                    userSpeaking={userSpeaking}
                    counterpartSpeaking={counterpartSpeaking}
                    userName={userName}
                    counterpartName={meetingName}
                />
                <div className="flex items-center justify-center py-2">
                    <CallUserTile />
                </div>
            </div>
            <div className="flex justify-center pb-8 pt-2">
                <div className="flex items-center gap-2 rounded-full border border-white/12 bg-[#1a1a1a]/80 px-3 py-2 backdrop-blur-xl">
                    <button
                        type="button"
                        className="wiora-glass-control"
                        aria-label={microphone.isMute ? "Unmute microphone" : "Mute microphone"}
                        onClick={() => void call?.microphone.toggle()}
                    >
                        {microphone.isMute ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
                    </button>
                    <button
                        type="button"
                        className="wiora-glass-control"
                        aria-label={camera.isMute ? "Turn camera on" : "Turn camera off"}
                        onClick={() => void call?.camera.toggle()}
                    >
                        {camera.isMute ? <VideoOffIcon className="size-4" /> : <VideoIcon className="size-4" />}
                    </button>
                    <CancelCallButton onLeave={onLeave} />
                </div>
            </div>
        </div>
    );
};
