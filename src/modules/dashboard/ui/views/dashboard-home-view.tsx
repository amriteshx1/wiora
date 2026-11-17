"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { LoadingState } from "@/components/loading-state";
import { ConversationTypeGrid } from "@/modules/preparations/ui/components/conversation-type-grid";
import type { ConversationType } from "@/modules/preparations/types";

function firstName(name?: string | null) {
  const word = name?.trim().split(/\s+/)[0];
  return word || "there";
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHomeView() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return <LoadingState title="Opening home" description="Finding your preparations" />;
  }

  const onChoose = (conversationType: ConversationType) => {
    router.push(`/preparations/new/${conversationType}`);
  };

  return (
    <div className="flex-1 px-4 pb-10 md:px-8">
      <div className="py-8 md:py-10">
        <h5 className="text-3xl font-medium tracking-tight md:text-4xl">
          {greeting()}, {firstName(data?.user.name)}
        </h5>
        <p className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          What is the plan for today? Pick the conversation you want to sit in before it happens.
        </p>
      </div>
      <ConversationTypeGrid onChoose={onChoose} />
    </div>
  );
}
