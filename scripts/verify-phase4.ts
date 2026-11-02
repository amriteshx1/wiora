import { createHmac, webcrypto } from "node:crypto";
import { Inngest } from "inngest";
import { neon } from "@neondatabase/serverless";
import { Webhook } from "standardwebhooks";

const sql = neon(process.env.DATABASE_URL!);
const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const failures: string[] = [];
const userIds: string[] = [];
const resumeAnchor = "WioraLedger migration cut latency by 37 percent";
const jobAnchor = "Own the interview platform's session clock";
const otherPhrase = "ZephyrQuartz private ledger";

function check(name: string, ok: boolean, detail = "") {
  const safe = detail.replace(/https?:\/\/\S+/g, "[url]").slice(0, 220);
  if (!ok) {
    failures.push(safe ? `${name}: ${safe}` : name);
    console.log("FAIL", name, safe);
    return;
  }
  console.log("PASS", name);
}

async function signCookie(token: string, secret: string) {
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return encodeURIComponent(`${token}.${Buffer.from(signature).toString("base64")}`);
}

async function trpc(cookie: string, path: string, input: unknown, method: "GET" | "POST" = "POST") {
  const url = method === "GET"
    ? `${base}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${base}/api/trpc/${path}`;
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json", cookie: `better-auth.session_token=${cookie}` },
    body: method === "POST" ? JSON.stringify(input) : undefined,
  });
  const body = await response.json().catch(() => null);
  return { payload: body?.result?.data, error: body?.error };
}

async function createSession(label: string) {
  const id = `p4${label}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const token = `p4${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 32);
  await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at) values (${id}, ${"phase4"}, ${`phase4-${id}@wiora.test`}, false, now(), now())`;
  await sql`insert into session (id, expires_at, token, created_at, updated_at, user_id) values (${id + "s"}, now() + interval '1 day', ${token}, now(), now(), ${id})`;
  userIds.push(id);
  return { id, cookie: await signCookie(token, process.env.BETTER_AUTH_SECRET!) };
}

async function postPolar(orderId: string, productId: string, runId: string) {
  const now = new Date().toISOString();
  const payload = {
    type: "order.paid",
    data: {
      id: orderId, created_at: now, modified_at: null, status: "paid", paid: true,
      subtotal_amount: 200, discount_amount: 0, net_amount: 200, amount: 200, tax_amount: 0,
      total_amount: 200, refunded_amount: 0, refunded_tax_amount: 0, currency: "usd",
      billing_reason: "purchase", billing_address: null, customer_id: "cus_phase4", product_id: productId,
      discount_id: null, subscription_id: null, checkout_id: "checkout_phase4", metadata: { runId },
      customer: { id: "cus_phase4", created_at: now, modified_at: null, metadata: {}, external_id: null, email: "phase4@wiora.test", email_verified: false, name: "Phase 4", billing_address: null, tax_id: null, organization_id: "org_phase4", deleted_at: null, avatar_url: "https://example.com/a.png" },
      user_id: "user_phase4",
      product: { metadata: {}, created_at: now, modified_at: null, id: productId, name: "Session", description: null, recurring_interval: null, is_recurring: false, is_archived: false, organization_id: "org_phase4" },
      discount: null, subscription: null,
      items: [{ created_at: now, modified_at: null, id: "item_phase4", label: "Session", amount: 200, tax_amount: 0, proration: false, product_price_id: null }],
    },
  };
  const body = JSON.stringify(payload);
  const webhook = new Webhook(Buffer.from(process.env.POLAR_WEBHOOK_SECRET!, "utf8").toString("base64"));
  const messageId = `msg_${Date.now().toString(36)}`;
  const timestamp = new Date();
  await fetch(`${base}/api/auth/polar/webhooks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": messageId,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": webhook.sign(messageId, timestamp, body),
    },
    body,
  });
}

async function postStream(runId: string, preparationId: string) {
  const body = JSON.stringify({
    type: "call.session_started",
    call_cid: `default:${runId}`,
    created_at: new Date().toISOString(),
    session_id: "phase4",
    call: { id: runId, custom: { runId, preparationId } },
  });
  const signature = createHmac("sha256", process.env.STREAM_VIDEO_SECRET_KEY!).update(body).digest("hex");
  await fetch(`${base}/api/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": signature, "x-api-key": "phase4" },
    body,
  });
}

async function waitFor(name: string, read: () => Promise<boolean>, timeoutMs: number) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await read()) return true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  check(name, false, "timed out");
  return false;
}

async function redirects() {
  for (const path of ["/meetings", "/agents", "/upgrade", "/meetings/old", "/agents/old"]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    const location = response.headers.get("location") || "";
    check(`${path} redirects to preparations`, response.status >= 300 && response.status < 400 && location.includes("/preparations"), `${response.status} ${location}`);
  }
}

async function main() {
  await sql`delete from "user" where email like 'phase4-%@wiora.test'`;
  await redirects();
  const owner = await createSession("a");
  const created = await trpc(owner.cookie, "preparations.create", { conversationType: "job_interview", title: "Report interview" });
  const preparationId = created.payload?.id as string;
  check("interview created", Boolean(preparationId), created.error?.message || "");
  const resume = Buffer.from(`${resumeAnchor}. The candidate kept the migration notes, the rollback plan, and the measured result from the cutover. `);
  const upload = await trpc(owner.cookie, "preparations.createUpload", {
    preparationId, fileName: "resume.txt", contentType: "text/plain", byteSize: resume.length,
  });
  const put = await fetch(upload.payload.uploadUrl, { method: "PUT", headers: { "content-type": "text/plain" }, body: new Uint8Array(resume) });
  check("resume uploaded", put.ok, String(put.status));
  await trpc(owner.cookie, "preparations.confirmUpload", { documentId: upload.payload.documentId });
  await trpc(owner.cookie, "preparations.updateContext", {
    id: preparationId,
    context: {
      company: "Stripe",
      jobTitle: "Backend engineer",
      jobDescription: `${jobAnchor} and keep a paid session inside its purchased duration.`,
      documents: [{ id: upload.payload.documentId, slot: "resume" }],
    },
  });
  const submitted = await trpc(owner.cookie, "preparations.submitFollowUps", { id: preparationId, answers: [] });
  check("interview submitted", submitted.payload?.status === "processing", submitted.error?.message || "");
  const ready = await waitFor("interview reaches ready", async () => {
    const [row] = await sql`select status from preparations where id = ${preparationId}`;
    return row?.status === "ready" || row?.status === "failed";
  }, 240000);
  if (!ready) return;
  const [prep] = await sql`select status, situation_model from preparations where id = ${preparationId}`;
  const modelText = JSON.stringify(prep.situation_model ?? {});
  check("brief has anchors and a read-only style", prep.status === "ready" && modelText.includes(resumeAnchor) && modelText.includes("rationale"), prep.status);

  const checkout = await trpc(owner.cookie, "runs.createCheckout", { preparationId, durationMinutes: 30 });
  const runId = checkout.payload?.runId as string;
  await postPolar(`order_${runId}`, process.env.POLAR_PRODUCT_30!, runId);
  const paid = await waitFor("session paid", async () => {
    const [row] = await sql`select status, brief_text from simulation_runs where id = ${runId}`;
    return row?.status === "paid" && typeof row.brief_text === "string";
  }, 30000);
  if (!paid) return;
  await postStream(runId, preparationId);
  const steered = await waitFor("vague answer changes the next turn", async () => {
    const [row] = await sql`select session_state from simulation_runs where id = ${runId}`;
    return Boolean(row?.session_state?.nextAction);
  }, 90000);
  if (steered) {
    const [row] = await sql`select session_state from simulation_runs where id = ${runId}`;
    check("next turn follows the updated state", row.session_state.nextAction === "challenge", String(row.session_state.nextAction));
  }
  await sql`update simulation_runs set status = 'processing', ended_at = now() - interval '11 minutes', transcript_url = null, updated_at = now() where id = ${runId}`;
  const inngest = new Inngest({ id: "wiora-2" });
  await inngest.send({ name: "runs/report", data: { runId } });
  const reported = await waitFor("report is written", async () => {
    const [row] = await sql`select status, report from simulation_runs where id = ${runId}`;
    return row?.status === "completed" && row.report != null;
  }, 120000);
  if (!reported) return;
  const [done] = await sql`select report from simulation_runs where id = ${runId}`;
  const turns = await sql`select text from session_turns where run_id = ${runId}`;
  const transcript = turns.map((turn) => String(turn.text)).join("\n");
  const weaknesses = done.report.weaknesses ?? [];
  check("report keeps at least one quoted weakness", weaknesses.length > 0, String(weaknesses.length));
  check("weakness quotes are substrings and have all five explanations", weaknesses.every((item: any) =>
    transcript.includes(item.quote) &&
    item.whatWentWrong && item.whyItWasProblematic && item.whatWasExpected &&
    item.whatAStrongAnswerWouldHaveDemonstrated && typeof item.missingEvidence === "string",
  ));

  const weaknessId = weaknesses[0]?.id;
  const drill = await trpc(owner.cookie, "runs.createDrill", { runId, weaknessId });
  const drillRunId = drill.payload?.runId as string;
  check("practice creates a run without a form", Boolean(drillRunId), drill.error?.message || "");
  const [drillRun] = await sql`select duration_minutes, drill_strategy, kind from simulation_runs where id = ${drillRunId}`;
  check("practice copies the duration", drillRun?.duration_minutes === 30 && drillRun.kind === "replay", String(drillRun?.duration_minutes));
  const replayPay = await trpc(owner.cookie, "runs.createCheckoutForExisting", { runId: drillRunId });
  check("practice opens checkout", typeof replayPay.payload?.url === "string" && replayPay.payload.durationMinutes === 30, replayPay.error?.message || "");
  await postPolar(`order_${drillRunId}`, process.env.POLAR_PRODUCT_30!, drillRunId);
  const drillReady = await waitFor("drill brief is rendered", async () => {
    const [row] = await sql`select status, brief_text from simulation_runs where id = ${drillRunId}`;
    return row?.status === "paid" && typeof row.brief_text === "string";
  }, 30000);
  if (drillReady) {
    const [row] = await sql`select brief_text from simulation_runs where id = ${drillRunId}`;
    const brief = String(row.brief_text);
    check("drill brief changes the angle and bans the previous quote", brief.includes(drillRun.drill_strategy.differentScenario) && brief.includes("Do not ask this previous quote") && brief.includes(drillRun.drill_strategy.bannedQuote) && !brief.includes(`Ask this: ${drillRun.drill_strategy.bannedQuote}`));
  }

  const other = await createSession("b");
  const custom = await trpc(other.cookie, "preparations.create", { conversationType: "custom", title: "Private custom" });
  await trpc(other.cookie, "preparations.updateContext", {
    id: custom.payload.id,
    context: { description: "I need to tell my roommate that the dishes have stayed in the sink for two weeks. No company is involved." },
  });
  await trpc(other.cookie, "preparations.submitFollowUps", { id: custom.payload.id, answers: [] });
  const customReady = await waitFor("custom preparation is ready", async () => {
    const [row] = await sql`select status from preparations where id = ${custom.payload.id}`;
    return row?.status === "ready" || row?.status === "failed";
  }, 180000);
  if (customReady) {
    const findings = await sql`select statement, category from research_findings where preparation_id = ${custom.payload.id}`;
    check("custom research can be one unknown finding", findings.length === 1 && findings[0].category === "unknown", JSON.stringify(findings));
  }

  const second = await trpc(owner.cookie, "preparations.create", { conversationType: "custom", title: "Second situation" });
  await trpc(owner.cookie, "preparations.updateContext", {
    id: second.payload.id,
    context: { description: otherPhrase },
  });
  const [firstBrief] = await sql`select brief_text from simulation_runs where id = ${runId}`;
  const [firstReport] = await sql`select report from simulation_runs where id = ${runId}`;
  const blob = `${firstBrief?.brief_text || ""}\n${JSON.stringify(firstReport?.report || {})}`;
  check("a second preparation stays out of the first report", !blob.includes(otherPhrase));

  const page = await fetch(`${base}/preparations`, { headers: { cookie: `better-auth.session_token=${owner.cookie}` } });
  const html = await page.text();
  check("sidebar has one item", html.includes("Preparations") && !html.includes('href="/meetings"') && !html.includes('href="/agents"') && !html.includes('href="/upgrade"'));
}

main()
  .catch((error) => check("verification finished", false, error instanceof Error ? error.message.slice(0, 180) : "crashed"))
  .finally(async () => {
    for (const id of userIds) await sql`delete from "user" where id = ${id}`;
    await sql`delete from "user" where email like 'phase4-%@wiora.test'`;
    if (failures.length > 0) process.exitCode = 1;
  });
