"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpIcon } from "lucide-react";
import { Channel as StreamChannel } from "stream-chat";
import { useCreateChatClient } from "stream-chat-react";

import { LoadingState } from "@/components/loading-state";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";

type ChatMessage = {
  id: string;
  text: string;
  mine: boolean;
  name: string;
};

interface Props {
  runId: string;
}

export function RunAsk({ runId }: Props) {
  const session = authClient.useSession();
  const user = session.data?.user;

  if (!user) {
    return (
      <div className="rounded-[24px] border bg-background">
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
  const { mutate: askAboutRun } = useMutation(trpc.runs.ask.mutationOptions({
    onError: () => setWaiting(false),
  }));
  const [channel, setChannel] = useState<StreamChannel>();
  const [waiting, setWaiting] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
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

  const readMessages = useCallback((next: StreamChannel) => {
    const mapped = next.state.messages
      .filter((message) => message.text?.trim())
      .map((message) => ({
        id: message.id,
        text: message.text!.trim(),
        mine: message.user?.id === userId,
        name: message.user?.name || (message.user?.id === userId ? userName : "Counterpart"),
      }));
    setMessages(mapped);
  }, [userId, userName]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    const next = client.channel("messaging", runId, {
      members: [userId],
    });
    next.watch().then(() => {
      if (cancelled) return;
      setChannel(next);
      readMessages(next);
    }).catch(() => {
      if (cancelled) return;
      setChannel(next);
      readMessages(next);
    });
    return () => {
      cancelled = true;
    };
  }, [client, readMessages, runId, userId]);

  useEffect(() => {
    if (!channel) return;
    const onMessage = (event: { user?: { id?: string }; message?: { text?: string } }) => {
      const text = event.message?.text?.trim();
      if (!text) return;
      readMessages(channel);
      if (event.user?.id === userId) {
        setWaiting(true);
        askAboutRun({ runId, text });
        return;
      }
      setWaiting(false);
    };
    channel.on("message.new", onMessage);
    return () => {
      channel.off("message.new", onMessage);
    };
  }, [askAboutRun, channel, readMessages, runId, userId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, waiting]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !channel || waiting) return;
    setDraft("");
    await channel.sendMessage({ text });
  };

  if (!client || !channel) {
    return (
      <div className="rounded-[24px] border bg-background">
        <LoadingState title="Opening ask" description="You can ask about what was said in this interview" />
      </div>
    );
  }

  return (
    <div className="wiora-ask flex h-[32rem] flex-col overflow-hidden rounded-[24px] border bg-background">
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6">
        {messages.length === 0 && !waiting ? (
          <p className="pt-16 text-center text-sm text-muted-foreground">
            Ask about a moment from this interview
          </p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.mine
                  ? "rounded-br-md bg-[#141414] text-[#f5f5f4]"
                  : "rounded-bl-md bg-muted text-foreground",
              )}
            >
              {!message.mine ? (
                <p className="mb-1 text-[11px] text-muted-foreground">{message.name}</p>
              ) : null}
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            </div>
          </div>
        ))}
        {waiting ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <span className="flex gap-1" aria-label="Thinking">
                <span className="call-bubble-dot size-1.5 rounded-full bg-foreground" />
                <span className="call-bubble-dot size-1.5 rounded-full bg-foreground [animation-delay:140ms]" />
                <span className="call-bubble-dot size-1.5 rounded-full bg-foreground [animation-delay:280ms]" />
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <form
        className="border-t bg-background p-3 md:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border bg-background px-3 py-2">
          <textarea
            value={draft}
            rows={1}
            placeholder="Type your message"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || waiting}
            className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#141414] text-[#f5f5f4] disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
