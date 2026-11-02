import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
    CallControls,
    SpeakerLayout,
} from "@stream-io/video-react-sdk";

interface Props{
    onLeave: () => void;
    meetingName: string;
    hardEndAt?: string | null;
};

function remainingLabel(hardEndAt: string): string {
    const remaining = Math.max(0, new Date(hardEndAt).getTime() - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const CallActive = ({ onLeave, meetingName, hardEndAt }: Props) => {
    const [clock, setClock] = useState(hardEndAt ? remainingLabel(hardEndAt) : "");

    useEffect(() => {
        if (!hardEndAt) return;
        const timer = setInterval(() => {
            setClock(remainingLabel(hardEndAt));
        }, 1000);
        return () => clearInterval(timer);
    }, [hardEndAt]);

    return (
        <div className="flex flex-col justify-between p-4 h-full text-white">
            <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
                <Link href="/" className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
                  <Image src="/logo.svg" width={22} height={22} alt="Logo"/>
                </Link>
                <h4 className="text-base">{meetingName}</h4>
                {hardEndAt ? <p className="ml-auto text-sm tabular-nums">{clock}</p> : null}
            </div>
            <SpeakerLayout />
            <div className="bg-[#101213] rounded-full px-4">
                <CallControls onLeave={onLeave} />
            </div>
        </div>
    );
};