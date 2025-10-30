import JSONL from "jsonl-parse-stringify";

import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { streamVideo } from "@/lib/stream-video";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const summarizer = createAgent({
  name: "summarizer",
  system: `
    You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
  `.trim(),
  model: openai({ model: "gpt-5-nano", apiKey: process.env.OPENAI_API_KEY }),
});

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    const response = await step.run("fetch-transcript", async() => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
          }))
        );

      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          }))
        );
      
      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if(!speaker){
          return {
            ...item,
            user: {
              name: "Unknown",
            },
          };
        }

        return {
          ...item,
          user: {
            name: speaker.name,
          },
        };
      });
    });

    const { output } = await summarizer.run(
      "Summarize the following transcript: " +
        JSON.stringify(transcriptWithSpeakers)
    );

    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: (output[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId))
    })

    await step.run("trigger-smart-followup", async () => {
      await inngest.send({
        name: "meetings/smart-followup",
        data: {
          meetingId: event.data.meetingId,
        },
    });
   });
  },
);

export const meetingTimeoutEnd = inngest.createFunction(
  { id: "meetings/timeout-end" },
  { event: "meetings/end-call-after-timeout" },
  async ({ event, step }) => {
    const { meetingId } = event.data;

    await step.sleep("wait-for-timeout", "30s");
    
    const [existingMeeting] = await step.run("check-meeting-status", async() => {
        return db.select().from(meetings).where(eq(meetings.id, meetingId));
    });

    if (existingMeeting && existingMeeting.status === "active") {
        await step.run("end-stream-call", async () => {
            const call = streamVideo.video.call("default", meetingId);
            await call.end();

            await db
              .update(meetings)
              .set({
                status: "processing",
                endedAt: new Date(),
              })
              .where(eq(meetings.id, meetingId));

            await inngest.send({
              name: "meetings/processing",
              data: {
                meetingId,
                transcriptUrl: existingMeeting.transcriptUrl || "",
              },
            });
            
        });
    } else {
        console.log(`Call for meeting ${meetingId} is not active. Skipping forced end.`);
    }
  },
);

export const smartFollowUp = inngest.createFunction(
  { id: "meetings/smart-followup" },
  { event: "meetings/smart-followup" },
  async ({ event, step }) => {
    const { meetingId } = event.data;

    // wait 24 hours
    await step.sleep("wait-24h", "24h");

    const [meeting] = await step.run("fetch-meeting", async () => {
      return db.select().from(meetings).where(eq(meetings.id, meetingId));
    });

    if (!meeting?.summary) return;

    const [userData] = await step.run("fetch-user", async () => {
      return db.select().from(user).where(eq(user.id, meeting.userId));
    });

    const { output } = await summarizer.run(`
You are Wiora’s Smart Follow-Up Agent.

Write a short, friendly **email message** (not a plain text paragraph) as a reminder for the user about their meeting.

Format it properly like an email with:
- A short greeting
- 2–3 bullet points summarizing what was discussed or next steps
- A closing line (e.g., “Talk soon” or “Your AI meeting assistant”)
- Keep tone warm, concise, and professional.

Meeting summary:
${meeting.summary}
`);


    const emailText = (output[0] as TextMessage).content as string;

    const listItems = emailText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^(\*|-)\s*/, ''))
      .map((line) => `<li>${line}</li>`)
      .join("");

    // Send email
    await step.run("send-email", async () => {
      await resend.emails.send({
        from: "Wiora <noreply@resend.dev>",
        to: userData.email,
        subject: "Smart Follow-Up from Your AI Meeting",
        html: `
          <div style="font-family: Inter, sans-serif; line-height: 1.6; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #111;">Hey ${userData.name || "there"}, 👋</h2>
            <p>Here’s a quick follow-up from your AI-powered meeting yesterday:</p>
            <ul style="margin: 12px 0; padding-left: 20px;">
              ${listItems}
            </ul>
            <p style="margin-top: 16px;">Stay productive,<br><strong>— Wiora</strong></p>
          </div>
        `,
        text: `Hey ${userData.name || "there"},\n\n${emailText}\n\n— Wiora`,
      });
    });
  }
);
