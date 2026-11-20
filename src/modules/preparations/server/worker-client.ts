export async function startWorker(runId: string): Promise<void> {
  const base = process.env.WORKER_URL;
  const secret = process.env.WORKER_SECRET;
  if (!base || !secret) {
    throw new Error("The session worker is not configured");
  }

  const response = await fetch(`${base.replace(/\/$/, "")}/runs/${encodeURIComponent(runId)}/start`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    throw new Error("The session worker did not start the interview");
  }
}
