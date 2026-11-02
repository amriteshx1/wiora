import Link from "next/link";

import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  detail: string;
}

export const CallEnded = ({ href, detail }: Props) => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
            <div className="py-4 px-8 flex flex-col flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium">You have ended the call</h6>
                        <p className="text-sm">{detail}</p>
                    </div>
                    <Button asChild>
                        <Link href={href}>Back</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};
