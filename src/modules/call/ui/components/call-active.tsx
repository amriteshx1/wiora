import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
    CancelCallButton,
    SpeakerLayout,
    ToggleAudioPublishingButton,
} from "@stream-io/video-react-sdk";

interface Props {
    onLeave: () => void;
    meetingName: string;
    hardEndAt?: string | null;
    backHref: string;
}

function remainingLabel(hardEndAt: string): string {
    const remaining = Math.max(0, new Date(hardEndAt).getTime() - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const CallActive = ({ onLeave, meetingName, hardEndAt, backHref }: Props) => {
    const [clock, setClock] = useState(hardEndAt ? remainingLabel(hardEndAt) : "");

    useEffect(() => {
        if (!hardEndAt) return;
        const timer = setInterval(() => {
            setClock(remainingLabel(hardEndAt));
        }, 1000);
        return () => clearInterval(timer);
    }, [hardEndAt]);

    return (
        <div className="flex h-full flex-col justify-between bg-[#141414] p-4 text-white">
            <div className="flex items-center gap-4 rounded-full bg-[#101213] p-4">
                <Link href={backHref} className="flex size-8 items-center justify-center rounded-full bg-white/10">
                  <Image src="/logo.svg" width={18} height={18} alt="Wiora"/>
                </Link>
                <h4 className="text-base">{meetingName}</h4>
                {hardEndAt ? <p className="ml-auto text-sm tabular-nums">{clock}</p> : null}
            </div>
            <SpeakerLayout />
            <div className="flex items-center justify-center gap-3 rounded-full bg-[#101213] px-4 py-3">
                <ToggleAudioPublishingButton />
                <CancelCallButton onLeave={onLeave} />
            </div>
        </div>
    );
};
