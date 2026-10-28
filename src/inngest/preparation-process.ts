import { inngest } from "@/inngest/client";

import { processPreparation } from "@/modules/preparations/server/process";

export const preparationsProcess = inngest.createFunction(
  {
    id: "preparations/process",
    concurrency: {
      limit: 1,
      key: "event.data.preparationId",
    },
  },
  { event: "preparations/process" },
  async ({ event }) => {
    await processPreparation({
      preparationId: event.data.preparationId,
      situationVersion: event.data.situationVersion,
      synthesizeOnly: event.data.synthesizeOnly === true,
    });
  },
);
