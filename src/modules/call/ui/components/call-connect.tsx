"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Call,
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
} from "@stream-io/video-react-sdk";

import { useTRPC } from "@/trpc/client";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import { CallUI } from "./call-ui";

interface Props{
    meetingId: string;
    meetingName: string;
    userId: string;
    userName: string;
    userImage: string;
    tokenSource?: "run";
    endedHref?: string;
    endedDetail?: string;
    hardEndAt?: string | null;
    layout?: "page" | "embed";
    onEnded?: () => void;
};

export const CallConnect = ({
    meetingId,
    meetingName,
    userId,
    userName,
    userImage,
    endedHref = "/preparations",
    endedDetail = "The report is being written on your preparation",
    hardEndAt = null,
    layout = "page",
    onEnded,
}: Props) => {
    const trpc = useTRPC();
    const { mutateAsync: generateRunToken} = useMutation(
        trpc.runs.generateToken.mutationOptions(),
    );
    const generateTokenRef = useRef(() => generateRunToken({ runId: meetingId }));
    generateTokenRef.current = () => generateRunToken({ runId: meetingId });

    const [client, setClient] = useState<StreamVideoClient>();
    useEffect(() => {
        const _client = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
            user: {
                id: userId,
                name: userName,
                image: userImage,
            },
            tokenProvider: () => generateTokenRef.current(),
        });

        setClient(_client);

        return () => {
            _client.disconnectUser();
            setClient(undefined);
        };
    }, [userId, userName, userImage]);

    const [call, setCall] = useState<Call>();
    useEffect(() => {
        if(!client) return;

        const _call = client.call("default", meetingId);
        _call.speaker.setVolume(1);
        void _call.microphone.disable();
        void _call.camera.disable();
        setCall(_call);

        return () => {
            if(_call.state.callingState !== CallingState.LEFT){
                _call.leave();
                setCall(undefined);
            }
        };
    }, [client, meetingId]);

    if(!client || !call){
        return (
            <div className={layout === "page" ? "flex h-screen items-center justify-center bg-background" : "flex h-full min-h-[28rem] items-center justify-center"}>
                <LoaderIcon className="size-6 text-foreground" />
            </div>
        );
    };

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallUI
                  runId={meetingId}
                  meetingName={meetingName}
                  endedHref={endedHref}
                  endedDetail={endedDetail}
                  hardEndAt={hardEndAt}
                  layout={layout}
                  onEnded={onEnded}
                />
            </StreamCall>
        </StreamVideo>
    );
};