import { inngest } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video";

import { sessionMinutes } from "@/modules/preparations/server/clock";
import { consumeCredit, reserveCredit, restoreCredit } from "@/modules/preparations/server/credits";
import { startWorker } from "@/modules/preparations/server/worker-client";
import { db } from "@/db";
import { simulationRuns } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type RunRow = typeof simulationRuns.$inferSelect;

export const runsHardStop = inngest.createFunction(
  { id: "runs/hard-stop" },
  { event: "runs/hard-stop" },
  async ({ event, step }) => {
    const hardEndAt = new Date(event.data.hardEndAt);
    await step.sleepUntil("wait-for-hard-end", new Date(hardEndAt.getTime() + 60_000));
    await step.run("end-if-active", async () => {
      const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, event.data.runId));
      if (!run || run.status !== "active") return;
      const call = streamVideo.video.call("default", run.id);
      await call.end();
      await db
        .update(simulationRuns)
        .set({
          status: "processing",
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "active")));
      await inngest.send({
        name: "runs/report",
        data: { runId: run.id },
      }).catch(() => {
        console.error("The report was not queued");
      });
    });
  },
);

export async function markRunActive(run: RunRow): Promise<void> {
  if (run.status === "active") {
    await startWorker(run.id).catch(() => {
      console.error("The session worker was not reached");
    });
    return;
  }
  const reserved = await reserveCredit(run.userId, run.id);
  if (reserved === "empty") {
    throw new Error("You need a credit to start this interview");
  }
  const minutes = sessionMinutes(run.durationMinutes);
  const startedAt = new Date();
  const hardEndAt = new Date(startedAt.getTime() + minutes * 60_000);
  const [updated] = await db
    .update(simulationRuns)
    .set({
      status: "active",
      startedAt,
      hardEndAt,
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "paid")))
    .returning({ id: simulationRuns.id });
  if (!updated) {
    if (run.status === "active") {
      await startWorker(run.id).catch(() => {
        console.error("The session worker was not reached");
      });
    }
    return;
  }
  try {
    await startWorker(run.id);
  } catch (error) {
    await restoreCredit(run.id);
    await db
      .update(simulationRuns)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(and(eq(simulationRuns.id, run.id), eq(simulationRuns.status, "active")));
    throw error;
  }
  await consumeCredit(run.id);
  await streamVideo.video.call("default", run.id).startRecording({
    recording_type: "video",
  }).catch(() => {
    console.error("Recording did not start");
  });
  await inngest.send({
    name: "runs/hard-stop",
    data: {
      runId: run.id,
      hardEndAt: hardEndAt.toISOString(),
    },
  }).catch(() => {
    console.error("The session clock was not scheduled");
  });
}

export async function endRunIfUserLeft(run: RunRow, userId: string | undefined): Promise<void> {
  if (!userId || userId === `cp_${run.id}`) return;
  if (userId !== run.userId) return;
  const call = streamVideo.video.call("default", run.id);
  await call.end();
}

export async function markRunProcessing(runId: string): Promise<void> {
  await db
    .update(simulationRuns)
    .set({
      status: "processing",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(simulationRuns.id, runId), eq(simulationRuns.status, "active")));
}

export async function finishRun(runId: string): Promise<void> {
  await markRunProcessing(runId);
  await inngest.send({
    name: "runs/report",
    data: { runId },
  }).catch(() => {
    console.error("The report was not queued");
  });
}
