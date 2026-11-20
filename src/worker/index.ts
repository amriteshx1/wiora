import { createServer } from "node:http";

import { resumeActiveRuns, startRun } from "./session";

const port = Number(process.env.PORT || 8787);

const server = createServer(async (request, response) => {
  const secret = process.env.WORKER_SECRET;
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    response.writeHead(401);
    response.end();
    return;
  }

  const match = request.url?.match(/^\/runs\/([^/]+)\/start$/);
  if (request.method === "POST" && match) {
    try {
      const runId = decodeURIComponent(match[1]);
      console.log(`Joining session ${runId}`);
      await startRun(runId);
      response.writeHead(200);
      response.end("ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The session did not start";
      console.error(message.slice(0, 180));
      response.writeHead(500);
      response.end();
    }
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(port, () => {
  console.log(`Session worker listening on ${port}`);
  void resumeActiveRuns().catch((error) => {
    const message = error instanceof Error ? error.message : "Active sessions were not resumed";
    console.error(message.slice(0, 180));
  });
});
