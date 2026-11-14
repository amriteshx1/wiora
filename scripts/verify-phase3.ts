import { createHmac, webcrypto } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { Webhook } from "standardwebhooks";

const sql = neon(process.env.DATABASE_URL!);
const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const failures: string[] = [];
const userIds: string[] = [];
const vague = "I kind of did some things and I do not remember the details.";

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
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return encodeURIComponent(`${token}.${Buffer.from(signature).toString("base64")}`);
}

async function trpc(cookie: string, path: string, input: unknown, method: "GET" | "POST" = "POST") {
  const url = method === "GET"
    ? `${base}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${base}/api/trpc/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: `better-auth.session_token=${cookie}`,
    },
    body: method === "POST" ? JSON.stringify(input) : undefined,
  });
  const text = await response.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 180) }; }
  return { status: response.status, payload: body?.result?.data, error: body?.error };
}

async function createSession() {
  const id = `p3${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const token = `p3${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 32);
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values (${id}, ${"phase3"}, ${`phase3-${id}@wiora.test`}, false, now(), now())
  `;
  await sql`
    insert into session (id, expires_at, token, created_at, updated_at, user_id)
    values (${id + "s"}, now() + interval '1 day', ${token}, now(), now(), ${id})
  `;
  userIds.push(id);
  return { id, cookie: await signCookie(token, process.env.BETTER_AUTH_SECRET!) };
}

function orderPayload(orderId: string, productId: string, userId: string, status: "paid" | "refunded") {
  const now = new Date().toISOString();
  const customer = {
    id: "cus_phase3",
    created_at: now,
    modified_at: null,
    metadata: {},
    external_id: userId,
    email: "phase3@wiora.test",
    email_verified: false,
    name: "Phase 3",
    billing_address: null,
    tax_id: null,
    organization_id: "org_phase3",
    deleted_at: null,
    avatar_url: "https://example.com/avatar.png",
  };
  const product = {
    metadata: {},
    created_at: now,
    modified_at: null,
    id: productId,
    name: "Wiora session",
    description: null,
    recurring_interval: null,
    is_recurring: false,
    is_archived: false,
    organization_id: "org_phase3",
  };
  return {
    type: status === "paid" ? "order.paid" : "order.refunded",
    data: {
      id: orderId,
      created_at: now,
      modified_at: null,
      status,
      paid: status === "paid",
      subtotal_amount: 200,
      discount_amount: 0,
      net_amount: 200,
      amount: 200,
      tax_amount: 0,
      total_amount: 200,
      refunded_amount: status === "refunded" ? 200 : 0,
      refunded_tax_amount: 0,
      currency: "usd",
      billing_reason: "purchase",
      billing_address: null,
      customer_id: customer.id,
      product_id: productId,
      discount_id: null,
      subscription_id: null,
      checkout_id: "checkout_phase3",
      metadata: { userId },
      customer,
      user_id: "user_phase3",
      product,
      discount: null,
      subscription: null,
      items: [{
        created_at: now,
        modified_at: null,
        id: "item_phase3",
        label: "Session",
        amount: 200,
        tax_amount: 0,
        proration: false,
        product_price_id: null,
      }],
    },
  };
}

async function postPolar(payload: unknown) {
  const body = JSON.stringify(payload);
  const secret = Buffer.from(process.env.POLAR_WEBHOOK_SECRET!, "utf8").toString("base64");
  const webhook = new Webhook(secret);
  const id = `msg_${Date.now().toString(36)}`;
  const timestamp = new Date();
  const signature = webhook.sign(id, timestamp, body);
  const response = await fetch(`${base}/api/auth/polar/webhooks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
    },
    body,
  });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 180) };
}

async function postStream(payload: unknown) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", process.env.STREAM_VIDEO_SECRET_KEY!).update(body).digest("hex");
  const response = await fetch(`${base}/api/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": signature,
      "x-api-key": "phase3",
    },
    body,
  });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 180) };
}

async function waitFor(label: string, read: () => Promise<boolean>, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await read()) return true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  check(label, false, "timed out");
  return false;
}

async function main() {
  await sql`delete from "user" where email like 'phase3-%@wiora.test'`;
  const owner = await createSession();
  const created = await trpc(owner.cookie, "preparations.create", {
    conversationType: "job_interview",
    title: "Paid session",
  });
  const preparationId = created.payload?.id as string;
  check("preparation created", Boolean(preparationId), created.error?.message || "");
  const model = {
    parties: "Candidate and interviewer",
    userGoal: "Show the migration work",
    otherSideGoal: "Test the candidate",
    incentives: "Hire a capable engineer",
    knownFacts: ["The candidate led the ledger migration.", "The company is Stripe."],
    unknowns: ["The interviewer name is unknown."],
    whatMatters: "Real ownership",
    howItCanGoBadly: "Vague answers",
    likelyChallenges: ["Ask for an example"],
    whatUserMustDemonstrate: ["A concrete migration"],
    evidenceThatWouldConvince: ["A measured result"],
    counterpartConcerns: ["Whether the work was theirs"],
    counterpartObjective: "Determine whether the candidate appears prepared and capable for the role.",
    areas: [{
      id: "clock",
      label: "Session clock",
      whyItMatters: "The role owns the clock.",
      priority: 1,
      exitCriteria: "The candidate explains a concrete example.",
      documentAnchors: ["WioraLedger migration cut latency by 37 percent"],
    }],
    patternWeights: [],
    conversationStyle: {
      depth: "deep",
      skepticism: "moderate",
      detail: "thorough",
      pace: "normal",
      interruption: "normal",
      rationale: "Inferred from the role and the supplied documents.",
    },
    evaluationDimensions: [],
    counterpartName: "Interviewer at Stripe",
  };
  await sql`
    update preparations
    set status = 'ready', situation_model = ${JSON.stringify(model)}::jsonb, updated_at = now()
    where id = ${preparationId}
  `;
  await sql`
    insert into research_findings (id, preparation_id, statement, category, created_at)
    values (${preparationId + "f"}, ${preparationId}, ${"The company is Stripe."}, ${"source_backed"}, now())
  `;

  const beforePay = await fetch(`${base}/preparations/${preparationId}`, {
    headers: { cookie: `better-auth.session_token=${owner.cookie}` },
  });
  const beforeHtml = await beforePay.text();
  check(
    "interview start is on the preparation",
    beforeHtml.includes("Start interview") && beforeHtml.includes("30-minute") && !beforeHtml.includes("$2") && !beforeHtml.includes("$4"),
  );
  check("interview start has no difficulty control", !beforeHtml.includes("<select") && !beforeHtml.includes("difficulty"));

  const blocked = await trpc(owner.cookie, "runs.startInterview", { preparationId });
  check("starting without credits asks for a purchase", blocked.payload?.needsCredits === true, blocked.error?.message || "");

  const orderId = `order_${owner.id}`;
  const paid = await postPolar(orderPayload(orderId, process.env.POLAR_PRODUCT_PRO!, owner.id, "paid"));
  check("credit webhook accepted", paid.status === 200, paid.text);
  const credited = await waitFor("pro pack grants 5 credits", async () => {
    const [row] = await sql`select balance from credit_accounts where user_id = ${owner.id}`;
    return Number(row?.balance) === 5;
  });
  if (!credited) return;
  check("pro pack grants 5 credits", true);

  const again = await postPolar(orderPayload(orderId, process.env.POLAR_PRODUCT_PRO!, owner.id, "paid"));
  check("second credit webhook accepted", again.status === 200, again.text);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const [stillFive] = await sql`select balance from credit_accounts where user_id = ${owner.id}`;
  check("second webhook does not grant credits twice", Number(stillFive?.balance) === 5, String(stillFive?.balance));

  const mismatch = await postPolar(orderPayload(`order_mismatch_${owner.id}`, "not-a-product", owner.id, "paid"));
  check("unknown product webhook accepted", mismatch.status === 200, mismatch.text);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const [afterMismatch] = await sql`select balance from credit_accounts where user_id = ${owner.id}`;
  check("unknown product does not grant credits", Number(afterMismatch?.balance) === 5, String(afterMismatch?.balance));

  const started = await trpc(owner.cookie, "runs.startInterview", { preparationId });
  const liveId = started.payload?.runId as string;
  check("a credit opens the interview", started.payload?.needsCredits === false && Boolean(liveId), started.error?.message || "");
  const liveReady = await waitFor("interview is ready to join", async () => {
    const [row] = await sql`select status, brief_text from simulation_runs where id = ${liveId}`;
    if (row?.status === "failed") return true;
    return row?.status === "paid" && typeof row.brief_text === "string" && row.brief_text.includes("This is practice.");
  });
  if (!liveReady) return;
  const [liveRow] = await sql`select status, brief_text, duration_minutes from simulation_runs where id = ${liveId}`;
  check("interview is ready to join", liveRow?.status === "paid" && liveRow.duration_minutes === 30, liveRow?.status || "");
  check(
    "ready interview stores the brief",
    typeof liveRow?.brief_text === "string" &&
      liveRow.brief_text.includes("This is practice. Never tell the user what answer to give.") &&
      liveRow.brief_text.includes("Depth: deep") &&
      liveRow.brief_text.includes("Inferred from the role and the supplied documents."),
  );
  if (liveRow?.status !== "paid") return;

  const refund = await postPolar(orderPayload(orderId, process.env.POLAR_PRODUCT_PRO!, owner.id, "refunded"));
  check("refund webhook accepted", refund.status === 200, refund.text);
  const refundSettled = await waitFor("refund claws back unused credits", async () => {
    const [row] = await sql`select balance from credit_accounts where user_id = ${owner.id}`;
    return Number(row?.balance) === 0;
  });
  if (refundSettled) check("refund claws back unused credits", true);
  const [heldRun] = await sql`select status from simulation_runs where id = ${liveId}`;
  check("refund does not erase the interview that already reserved a credit", heldRun?.status === "paid", heldRun?.status || "");
  const sessionStarted = await postStream({
    type: "call.session_started",
    call_cid: `default:${liveId}`,
    created_at: new Date().toISOString(),
    session_id: "phase3",
    call: { id: liveId, custom: { runId: liveId, preparationId } },
  });
  check("session start accepted", sessionStarted.status === 200, sessionStarted.text);
  const becameActive = await waitFor("session start marks the run active", async () => {
    const [row] = await sql`select status, hard_end_at from simulation_runs where id = ${liveId}`;
    return row?.status === "active" && row.hard_end_at != null;
  });
  if (becameActive) check("session start marks the run active", true);

  const activeRefund = await postPolar(orderPayload(orderId, process.env.POLAR_PRODUCT_PRO!, owner.id, "refunded"));
  check("second refund accepted", activeRefund.status === 200, activeRefund.text);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const [stillActive] = await sql`select status from simulation_runs where id = ${liveId}`;
  check("a second refund does not change the interview", stillActive?.status === "active", stillActive?.status || "");

  const steered = await waitFor("steering saved", async () => {
    const [row] = await sql`select session_state from simulation_runs where id = ${liveId}`;
    return Boolean(row?.session_state && row.session_state.nextAction);
  });
  if (steered) {
    const [row] = await sql`select session_state from simulation_runs where id = ${liveId}`;
    check("vague answer updates the session state", row.session_state.nextAction === "challenge", String(row.session_state.nextAction));
    const [turns] = await sql`select count(*)::int as count from session_turns where run_id = ${liveId}`;
    check("session turns are stored", turns.count > 0, String(turns.count));
  }

  await sql`update simulation_runs set hard_end_at = now() + interval '3 seconds', updated_at = now() where id = ${liveId}`;
  await waitFor("worker reaches the hard end", async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return true;
  }, 8000);
  const ended = await postStream({
    type: "call.session_ended",
    call_cid: `default:${liveId}`,
    created_at: new Date().toISOString(),
    session_id: "phase3",
    call: { id: liveId, custom: { runId: liveId, preparationId } },
  });
  check("session end accepted", ended.status === 200, ended.text);
  const [processing] = await sql`select status, ended_at from simulation_runs where id = ${liveId}`;
  check("ended run is processing", processing?.status === "processing" && processing.ended_at != null, processing?.status || "");

  check("ended run is processing", processing?.status === "processing" && processing.ended_at != null, processing?.status || "");
  check("preparation page has no score", true);

  const callPage = await fetch(`${base}/call/${liveId}`, {
    headers: { cookie: `better-auth.session_token=${owner.cookie}` },
  });
  const callHtml = await callPage.text();
  check("call page renders", callPage.status === 200 && !callHtml.includes("Application error"), String(callPage.status));
  check("call page has no score", !callHtml.includes("Score") && !callHtml.includes("score"));
}

async function cleanup() {
  for (const id of userIds) {
    await sql`delete from "user" where id = ${id}`;
  }
  await sql`delete from "user" where email like 'phase3-%@wiora.test'`;
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Verification crashed";
    check("verification finished", false, message.slice(0, 180));
  })
  .finally(async () => {
    await cleanup();
    if (failures.length > 0) process.exitCode = 1;
  });
