import { useEffect, useState } from "react";
import Link from "next/link";

import { isFreeUser } from "@/lib/isFreeUser";

import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
}

export const CallEnded = ({ userId }: Props) => {
    const [isFree, setIsFree] = useState<boolean | null>(null);

    useEffect(() => {
      (async () => {
        const free = await isFreeUser(userId);
        setIsFree(free);
      })();
    }, [userId]);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
            <div className="py-4 px-8 flex flex-col flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium">You have ended the call</h6>
                        <p className="text-sm">Summary will appear in a few minutes.</p>
                    </div>
                    <Button asChild>
                        <Link href="/meetings">Back to meetings</Link>
                    </Button>
                </div>
                {isFree && (
                  <p className="text-xs mt-5 text-white/70 text-center">Free call ended after a minute. Kindly{" "} 
                      <Link href="/upgrade" className="text-white underline">
                          Upgrade
                      </Link>{" "}
                      to enjoy longer sessions.
                  </p>
                )}
            </div>
        </div>
    );
};
