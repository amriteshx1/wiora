import Link from "next/link";

import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  detail: string;
  counterpartName?: string;
}

export const CallEnded = ({ href, detail, counterpartName }: Props) => {
    return (
        <div className="flex h-full flex-col items-center justify-center bg-background">
            <div className="flex w-full max-w-md flex-col gap-6 rounded-md border p-8">
                <div className="space-y-2">
                    <h6 className="text-lg font-medium">
                      {counterpartName ? `The interview with ${counterpartName} has ended` : "The interview has ended"}
                    </h6>
                    <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
                <Button asChild>
                    <Link href={href}>Back to report</Link>
                </Button>
            </div>
        </div>
    );
};
