export async function startWorker(runId: string): Promise<void> {
  const base = process.env.WORKER_URL;
  const secret = process.env.WORKER_SECRET;
  if (!base || !secret) {
    console.error("The session worker is not configured");
    return;
  }

  const response = await fetch(`${base.replace(/\/$/, "")}/runs/${encodeURIComponent(runId)}/start`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    console.error(`The session worker did not start the run (${response.status})`);
  }
}
