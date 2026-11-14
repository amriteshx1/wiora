"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const session = authClient.useSession();
  const user = session.data?.user;

  if (!user) {
    return (
      <div className="rounded-md border bg-background">
        <LoadingState title="Opening ask" description="You can ask about what was said in this interview" />
      </div>
    );
  }

  return (
    <RunAskChat
      runId={runId}
      userId={user.id}
      userName={user.name ?? "You"}
      userImage={user.image || undefined}
    />
  );
}

function RunAskChat({
  runId,
  userId,
  userName,
  userImage,
}: {
  runId: string;
  userId: string;
  userName: string;
  userImage?: string;
}) {
  const trpc = useTRPC();
  const { mutateAsync: generateChatToken } = useMutation(trpc.runs.generateChatToken.mutationOptions());
  const { mutate: askAboutRun } = useMutation(trpc.runs.ask.mutationOptions());
  const [channel, setChannel] = useState<StreamChannel>();
  const tokenProvider = useCallback(() => generateChatToken({ runId }), [generateChatToken, runId]);
  const userData = useMemo(
    () => ({ id: userId, name: userName, image: userImage }),
    [userId, userName, userImage],
  );
  const client = useCreateChatClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
    tokenOrProvider: tokenProvider,
    userData,
  });

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const next = client.channel("messaging", runId, {
      members: [userId],
    });
    next.watch().then(() => {
      if (!cancelled) setChannel(next);
    }).catch(() => {
      if (!cancelled) setChannel(next);
    });
    return () => {
      cancelled = true;
    };
  }, [client, runId, userId]);

  useEffect(() => {
    if (!channel) return;
    const onMessage = (event: { user?: { id?: string }; message?: { text?: string } }) => {
      if (event.user?.id !== userId) return;
      const text = event.message?.text?.trim();
      if (!text) return;
      askAboutRun({ runId, text });
    };
    channel.on("message.new", onMessage);
    return () => {
      channel.off("message.new", onMessage);
    };
  }, [askAboutRun, channel, runId, userId]);

  if (!client || !channel) {
    return (
      <div className="rounded-md border bg-background">
        <LoadingState title="Opening ask" description="You can ask about what was said in this interview" />
      </div>
    );
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-md border bg-background [&_.str-chat]:h-full [&_.str-chat-channel]:h-full [&_.str-chat__container]:h-full">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <div className="min-h-0 flex-1 overflow-y-auto border-b">
              <MessageList />
            </div>
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
