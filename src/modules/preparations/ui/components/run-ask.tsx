"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Channel as StreamChannel } from "stream-chat";
import { Channel, Chat, MessageInput, MessageList, Thread, useCreateChatClient, Window } from "stream-chat-react";

import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";

import "stream-chat-react/dist/css/v2/index.css";

interface Props {
  runId: string;
}

export function RunAsk({ runId }: Props) {
  const trpc = useTRPC();
  const session = authClient.useSession();
  const { mutateAsync: generateChatToken } = useMutation(trpc.runs.generateChatToken.mutationOptions());
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: () => generateChatToken({ runId }),
    userData: {
      id: session.data?.user.id ?? "pending",
      name: session.data?.user.name ?? "You",
      image: session.data?.user.image || undefined,
    },
  });

  useEffect(() => {
    if (!client || !session.data?.user) return;
    setChannel(client.channel("messaging", runId, {
      members: [session.data.user.id],
    }));
  }, [client, runId, session.data?.user]);

  if (!client || !session.data?.user) {
    return <LoadingState title="Loading chat" description="This may take a few seconds" />;
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b">
              <MessageList />
            </div>
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
