import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { preparationsProcess } from "@/inngest/preparation-process";
import { runsHardStop } from "@/inngest/run-hard-stop";
import { runsReport } from "@/inngest/run-report";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    preparationsProcess,
    runsHardStop,
    runsReport,
  ],
});