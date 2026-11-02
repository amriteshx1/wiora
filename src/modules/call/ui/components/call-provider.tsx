"use client";

import { LoaderIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { CallConnect } from "./call-connect";

interface Props{
    meetingId: string;
    meetingName: string;
    tokenSource?: "run";
    endedHref?: string;
    endedDetail?: string;
    hardEndAt?: string | null;
};

export const CallProvider = ({
    meetingId,
    meetingName,
    tokenSource,
    endedHref,
    endedDetail,
    hardEndAt,
}: Props) => {
    const { data, isPending } = authClient.useSession();

    if(!data || isPending){
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        )
    }

    return (
        <CallConnect 
          meetingId={meetingId}
          meetingName={meetingName}
          userId={data.user.id}
          userName={data.user.name}
          userImage={
            data.user.image ?? 
              generateAvatarUri({ seed: data.user.name, variant: "initials"})
          }
          tokenSource={tokenSource}
          endedHref={endedHref}
          endedDetail={endedDetail}
          hardEndAt={hardEndAt}
        />
    );
};
