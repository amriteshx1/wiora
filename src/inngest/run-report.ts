import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { sessionTurns, simulationRuns } from "@/db/schema";
import { inngest } from "@/inngest/client";

import { buildReport } from "@/modules/preparations/server/report";

export const runsReport = inngest.createFunction(
  { id: "runs/report" },
  { event: "runs/report" },
  async ({ event, step }) => {
    const initial = await step.run("load-run", async () => {
      const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, event.data.runId));
      if (!run) return null;
      const [turn] = await db
        .select({ id: sessionTurns.id })
        .from(sessionTurns)
        .where(eq(sessionTurns.runId, run.id))
        .limit(1);
      return { ...run, hasTurns: Boolean(turn) };
    });
    if (!initial || initial.report) return;

    if (!initial.transcriptUrl && !initial.hasTurns) {
      const endedAt = initial.endedAt ? new Date(initial.endedAt).getTime() : Date.now();
      const deadline = new Date(endedAt + 10 * 60 * 1000);
      if (deadline.getTime() > Date.now()) {
        await step.sleepUntil("wait-for-transcript", deadline);
      }
    }

    await step.run("build-report", async () => {
      const [run] = await db
        .select()
        .from(simulationRuns)
        .where(and(eq(simulationRuns.id, event.data.runId), isNull(simulationRuns.report)));
      if (!run) return;
      const [turn] = await db
        .select({ id: sessionTurns.id })
        .from(sessionTurns)
        .where(eq(sessionTurns.runId, run.id))
        .limit(1);
      if (!run.transcriptUrl && !turn) {
        await db
          .update(simulationRuns)
          .set({ status: "failed", updatedAt: new Date() })
          .where(and(
            eq(simulationRuns.id, run.id),
            eq(simulationRuns.status, "processing"),
            isNull(simulationRuns.report),
          ));
        return;
      }
      await buildReport(run.id);
    });
  },
);
