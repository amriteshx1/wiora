import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { simulationRuns } from "@/db/schema";
import { inngest } from "@/inngest/client";

import { buildReport } from "@/modules/preparations/server/report";

export const runsReport = inngest.createFunction(
  { id: "runs/report" },
  { event: "runs/report" },
  async ({ event, step }) => {
    const initial = await step.run("load-run", async () => {
      const [run] = await db.select().from(simulationRuns).where(eq(simulationRuns.id, event.data.runId));
      return run ?? null;
    });
    if (!initial || initial.report) return;

    if (!initial.transcriptUrl) {
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
      if (!run.transcriptUrl) {
        const endedAt = run.endedAt ? new Date(run.endedAt).getTime() : 0;
        if (Date.now() < endedAt + 10 * 60 * 1000) return;
      }
      await buildReport(run.id);
    });
  },
);
