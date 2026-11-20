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
    layout?: "page" | "embed";
    onEnded?: () => void;
};

export const CallProvider = ({
    meetingId,
    meetingName,
    tokenSource,
    endedHref,
    endedDetail,
    hardEndAt,
    layout = "page",
    onEnded,
}: Props) => {
    const { data, isPending } = authClient.useSession();

    if(!data || isPending){
        return (
            <div className={layout === "page" ? "flex h-screen items-center justify-center bg-background" : "flex h-full min-h-[28rem] items-center justify-center"}>
                <LoaderIcon className="size-6 text-foreground" />
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
          layout={layout}
          onEnded={onEnded}
        />
    );
};
