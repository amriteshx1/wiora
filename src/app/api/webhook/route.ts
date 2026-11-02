import OpenAI from "openai";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

import { 
    MessageNewEvent,
    CallEndedEvent,
    CallTranscriptionReadyEvent,
    CallSessionParticipantLeftEvent,
    CallRecordingReadyEvent,
    CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { db } from "@/db";
import { agents, meetings, preparations, simulationRuns } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";
import { endRunIfUserLeft, markRunActive, markRunProcessing } from "@/inngest/run-hard-stop";
import { startWorker } from "@/modules/preparations/server/worker-client";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function verifySignatureWithSDK(body: string, signature: string): boolean {
    return streamVideo.verifyWebhook(body, signature);
}

async function lookupRun(payload: Record<string, unknown>) {
    const call = payload.call as { id?: string; custom?: { runId?: string } } | undefined;
    const cid = typeof payload.call_cid === "string" ? payload.call_cid.split(":")[1] : undefined;
    const channelId = typeof payload.channel_id === "string" ? payload.channel_id : undefined;
    const candidates = [call?.custom?.runId, call?.id, cid, channelId].filter((value): value is string => Boolean(value));
    for (const id of [...new Set(candidates)]) {
        const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, id));
        if (run) return run;
    }
    return null;
}

export async function POST(req: NextRequest){
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");

    if(!signature || !apiKey){
        return NextResponse.json(
            { error: "Missing signature or API key" },
            {status: 400}
        );
    }

    const body = await req.text();

    if(!verifySignatureWithSDK(body, signature)) {
        return NextResponse.json({error: "Invalid signature"}, { status: 401 });
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json({error: "Invalid JSON"}, { status: 400 });
    }

    const eventType = (payload as Record<string, unknown>)?.type;
    const run = await lookupRun(payload as Record<string, unknown>);

    if (run) {
        if (eventType === "call.session_started") {
            if (run.status === "paid") {
                await markRunActive(run);
            } else if (run.status === "active") {
                await startWorker(run.id);
            }
        } else if (eventType === "call.session_participant_left") {
            const event = payload as CallSessionParticipantLeftEvent;
            await endRunIfUserLeft(run, event.participant?.user?.id);
        } else if (eventType === "call.session_ended") {
            if (run.status === "active") {
                await markRunProcessing(run.id);
            }
        } else if (eventType === "call.transcription_ready") {
            const event = payload as CallTranscriptionReadyEvent;
            await db
                .update(simulationRuns)
                .set({
                    transcriptUrl: event.call_transcription.url,
                    updatedAt: new Date(),
                })
                .where(eq(simulationRuns.id, run.id));
            await inngest.send({
                name: "runs/report",
                data: { runId: run.id },
            });
        } else if (eventType === "call.recording_ready") {
            const event = payload as CallRecordingReadyEvent;
            await db
                .update(simulationRuns)
                .set({
                    recordingUrl: event.call_recording.url,
                    updatedAt: new Date(),
                })
                .where(eq(simulationRuns.id, run.id));
        }

        if (eventType === "message.new") {
            const event = payload as MessageNewEvent;
            if (run.status !== "completed") {
                return NextResponse.json({ status: "ok" });
            }
            const userId = event.user?.id;
            const channelId = event.channel_id;
            const text = event.message?.text;
            if (!userId || !channelId || !text || userId === `cp_${run.id}`) {
                return NextResponse.json({ status: "ok" });
            }
            const [preparation] = await db.select().from(preparations).where(eq(preparations.id, run.preparationId));
            const instructions = [
                "Answer questions about one completed practice session.",
                "Use only the report and the situation model.",
                `Report: ${JSON.stringify(run.report)}`,
                `Situation: ${JSON.stringify(preparation?.situationModel ?? {})}`,
            ].join("\n\n");
            const channel = streamChat.channel("messaging", channelId);
            await channel.watch();
            const previousMessages = channel.state.messages
                .slice(-5)
                .filter((message) => message.text && message.text.trim() !== "")
                .map<ChatCompletionMessageParam>((message) => ({
                    role: message.user?.id === `cp_${run.id}` ? "assistant" : "user",
                    content: message.text || "",
                }));
            const completion = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna",
                messages: [
                    { role: "system", content: instructions },
                    ...previousMessages,
                    { role: "user", content: text },
                ],
            });
            const reply = completion.choices[0]?.message.content;
            if (reply) {
                const counterpartName = run.counterpartName || "Counterpart";
                await streamChat.upsertUser({
                    id: `cp_${run.id}`,
                    name: counterpartName,
                });
                await channel.sendMessage({
                    text: reply,
                    user: { id: `cp_${run.id}`, name: counterpartName },
                });
            }
            return NextResponse.json({ status: "ok" });
        }

        return NextResponse.json({ status: "ok" });
    }

    if(eventType === "call.session_started") {
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;

        if(!meetingId){
            return NextResponse.json({ error: "Missing meetingId"}, {status: 400});
        }

        const [existingMeeting] = await db
          .select()
          .from(meetings)
          .where(
            and(
                eq(meetings.id, meetingId),
                not(eq(meetings.status, "completed")),
                not(eq(meetings.status, "active")),
                not(eq(meetings.status, "cancelled")),
                not(eq(meetings.status, "processing")),
            )
          );

        if(!existingMeeting){
            return NextResponse.json({error: "Meeting not found"}, {status: 404});
        }

        await db
          .update(meetings)
          .set({
            status: "active",
            startedAt: new Date(),
          })
          .where(eq(meetings.id, existingMeeting.id));

        const [existingAgent] = await db
          .select()
          .from(agents)
          .where(eq(agents.id, existingMeeting.agentId));

        if(!existingAgent){
            return NextResponse.json({error: "Agent not found"}, {status: 404});
        }

        const call = streamVideo.video.call("default", meetingId);
        const realtimeClient = await streamVideo.video.connectOpenAi({
            call,
            openAiApiKey: process.env.OPENAI_API_KEY!,
            agentUserId: existingAgent.id,
        });

        realtimeClient.updateSession({
            instructions: existingAgent.instructions,
        });
    } else if (eventType === "call.session_participant_left"){
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(":")[1];

        if(!meetingId){
            return NextResponse.json({ error: "Missing meetingId"}, {status: 400});
        }

        const call = streamVideo.video.call("default", meetingId);
        await call.end();
    } else if (eventType === "call.session_ended"){
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;

        if(!meetingId){
            return NextResponse.json({ error: "Missing meetingId"}, {status: 400});
        }

        await db
          .update(meetings)
          .set({
            status: "processing",
            endedAt: new Date(),
          })
          .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
    } else if (eventType === "call.transcription_ready") {
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        const [updatedMeeting] = await db
          .update(meetings)
          .set({
            transcriptUrl: event.call_transcription.url,
          })
          .where(eq(meetings.id, meetingId))
          .returning();

        if(!updatedMeeting) {
            return NextResponse.json({ error: "Meeting not found"}, {status: 404});
        }

        await inngest.send({
            name: "meetings/processing",
            data: {
                meetingId: updatedMeeting.id,
                transcriptUrl: updatedMeeting.transcriptUrl,
            },
        });
    } else if (eventType === "call.recording_ready"){
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(":")[1];

        await db
          .update(meetings)
          .set({
            recordingUrl: event.call_recording.url,
          })
          .where(eq(meetings.id, meetingId));
    } else if (eventType === "message.new"){
        const event = payload as MessageNewEvent;

        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        if(!userId || !channelId || !text){
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        const [existingMeeting] = await db
          .select()
          .from(meetings)
          .where(and(eq(meetings.id, channelId), eq(meetings.status, "completed")));

        if(!existingMeeting){
            return NextResponse.json({error: "Meeting not found"}, {status: 404});
        }

        const [existingAgent] = await db
          .select()
          .from(agents)
          .where(eq(agents.id, existingMeeting.agentId));
        
        if(!existingAgent){
            return NextResponse.json({error: "Agent not found"}, {status: 404});
        }

        if(userId !== existingAgent.id){
            const instructions = `
      You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
      `;

      const channel = streamChat.channel("messaging", channelId);
      await channel.watch();

      const previousMessages = channel.state.messages
        .slice(-5)
        .filter((msg) => msg.text && msg.text.trim() !== "")
        .map<ChatCompletionMessageParam>((message) => ({
            role: message.user?.id === existingAgent.id ? "assistant" : "user",
            content: message.text || "",
        }));

      const GPTResponse = await openaiClient.chat.completions.create({
        messages: [
            {role: "system", content: instructions},
            ...previousMessages,
            {role: "user", content: text},
        ],
        model: "gpt-5-nano",
      });

      const GPTResponseText = GPTResponse.choices[0].message.content;

      if(!GPTResponseText){
        return NextResponse.json(
            {error: "No response from GPT"},
            {status: 400}
        );
      }

      const avatarUrl = generateAvatarUri({
        seed: existingAgent.name,
        variant: "botttsNeutral",
      });

      streamChat.upsertUser({
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      });

      channel.sendMessage({
        text: GPTResponseText,
        user: {
            id: existingAgent.id,
            name: existingAgent.name,
            image: avatarUrl,
        },
      });
      }  
    }

    return NextResponse.json({status: "ok"});
}