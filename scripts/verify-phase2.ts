import { webcrypto } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const sql = neon(process.env.DATABASE_URL!);
const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const failures: string[] = [];
const objectKeys: string[] = [];
const userIds: string[] = [];

const resumeAnchor = "WioraLedger migration cut latency by 37 percent";
const jobAnchor = "Own the interview platform's session clock";

function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    const safe = detail.replace(/https?:\/\/\S+/g, "[url]").slice(0, 240);
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
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 180) };
  }
  return {
    status: response.status,
    payload: body?.result?.data,
    error: body?.error,
  };
}

async function createSession() {
  const id = `p2${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `phase2-${id}@wiora.test`;
  const token = `p2${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 32);
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values (${id}, ${"phase2"}, ${email}, false, now(), now())
  `;
  await sql`
    insert into session (id, expires_at, token, created_at, updated_at, user_id)
    values (${id + "s"}, now() + interval '1 day', ${token}, now(), now(), ${id})
  `;
  userIds.push(id);
  return { id, cookie: await signCookie(token, process.env.BETTER_AUTH_SECRET!) };
}

async function uploadFile(cookie: string, preparationId: string, fileName: string, contentType: string, bytes: Buffer) {
  const created = await trpc(cookie, "preparations.createUpload", {
    preparationId,
    fileName,
    contentType,
    byteSize: bytes.length,
  });
  if (!created.payload?.uploadUrl || !created.payload.documentId) {
    throw new Error(created.error?.message || "Upload URL was not created");
  }
  const put = await fetch(created.payload.uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: new Uint8Array(bytes),
  });
  if (!put.ok) {
    throw new Error(`Upload failed with status ${put.status}`);
  }
  const confirmed = await trpc(cookie, "preparations.confirmUpload", {
    documentId: created.payload.documentId,
  });
  if (confirmed.payload?.objectKey) {
    objectKeys.push(confirmed.payload.objectKey);
  }
  if (confirmed.error) {
    throw new Error(confirmed.error.message || "Upload confirmation failed");
  }
  return created.payload.documentId as string;
}

async function waitUntilSettled(cookie: string, id: string) {
  const started = Date.now();
  let latest: any = null;
  while (Date.now() - started < 240000) {
    const result = await trpc(cookie, "preparations.getOne", { id }, "GET");
    latest = result.payload;
    if (latest?.status === "ready" || latest?.status === "failed") {
      return latest;
    }
    if (result.error) {
      throw new Error(result.error.message || "Could not load the preparation");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return latest;
}

function anchorText(model: any) {
  return (model?.areas ?? [])
    .flatMap((area: { documentAnchors?: string[] }) => area.documentAnchors ?? [])
    .join("\n");
}

async function main() {
  const owner = await createSession();
  const resume = Buffer.from(
    `${resumeAnchor}. The candidate kept the migration notes, the rollback plan, and the service-level measurements from the ledger cutover. `,
  );
  const broken = Buffer.from("this is not a pdf");

  const interview = await trpc(owner.cookie, "preparations.create", {
    conversationType: "job_interview",
    title: "Backend interview",
  });
  check("interview created", Boolean(interview.payload?.id), interview.error?.message || "");
  const interviewId = interview.payload.id as string;
  const resumeId = await uploadFile(owner.cookie, interviewId, "resume.txt", "text/plain", resume);
  const brokenId = await uploadFile(owner.cookie, interviewId, "broken.pdf", "application/pdf", broken);
  const interviewContext = {
    company: "Stripe",
    jobTitle: "Backend engineer",
    jobDescription: `${jobAnchor} and keep a paid session inside its purchased duration.`,
    documents: [
      { id: resumeId, slot: "resume" },
      { id: brokenId, slot: "extra" },
    ],
  };
  await trpc(owner.cookie, "preparations.updateContext", {
    id: interviewId,
    context: interviewContext,
  });
  const interviewSubmit = await trpc(owner.cookie, "preparations.submitFollowUps", {
    id: interviewId,
    answers: [],
  });
  check(
    "interview submit starts processing",
    interviewSubmit.payload?.status === "processing" && interviewSubmit.payload?.processingStep === "extracting",
    interviewSubmit.error?.message || interviewSubmit.payload?.status || "",
  );

  const difficult = await trpc(owner.cookie, "preparations.create", {
    conversationType: "difficult_conversation",
    title: "Dishes",
  });
  const difficultId = difficult.payload.id as string;
  await trpc(owner.cookie, "preparations.updateContext", {
    id: difficultId,
    context: {
      people: "My roommate",
      situation: "They have left dishes in the sink for two weeks and I want to talk about it in our apartment.",
      desiredOutcome: "We agree who washes the dishes each day.",
      relationship: "We share an apartment and there is no company or public organization involved.",
    },
  });
  const difficultSubmit = await trpc(owner.cookie, "preparations.submitFollowUps", {
    id: difficultId,
    answers: [],
  });
  check(
    "difficult submit starts processing",
    difficultSubmit.payload?.status === "processing",
    difficultSubmit.error?.message || "",
  );

  const readyInterview = await waitUntilSettled(owner.cookie, interviewId);
  const readyDifficult = await waitUntilSettled(owner.cookie, difficultId);

  check("interview reaches ready", readyInterview?.status === "ready", readyInterview?.error || readyInterview?.status || "timeout");
  const anchors = anchorText(readyInterview?.situationModel);
  check("resume anchor is in the brief", anchors.includes(resumeAnchor));
  check("job description anchor is in the brief", anchors.includes(jobAnchor));
  const style = readyInterview?.situationModel?.conversationStyle;
  check(
    "style is present and read-only data",
    Boolean(style?.rationale) &&
      ["surface", "mixed", "deep"].includes(style?.depth) &&
      ["low", "moderate", "high"].includes(style?.skepticism) &&
      ["practical", "mixed", "thorough"].includes(style?.detail) &&
      ["unhurried", "normal", "brisk"].includes(style?.pace) &&
      ["rare", "normal", "frequent"].includes(style?.interruption),
    JSON.stringify(style ?? {}).slice(0, 180),
  );
  const brokenDocument = readyInterview?.documents?.find((document: { id: string }) => document.id === brokenId);
  const resumeDocument = readyInterview?.documents?.find((document: { id: string }) => document.id === resumeId);
  check("broken file is failed", brokenDocument?.status === "failed", brokenDocument?.status || "missing");
  check("resume stays ready", resumeDocument?.status === "ready" && resumeDocument?.reading != null);

  check("difficult conversation reaches ready", readyDifficult?.status === "ready", readyDifficult?.error || readyDifficult?.status || "timeout");
  check(
    "difficult conversation stores one unknown finding",
    readyDifficult?.findings?.length === 1 &&
      readyDifficult.findings[0].category === "unknown" &&
      readyDifficult.findings[0].statement === "Public research was not useful for this situation.",
    JSON.stringify(readyDifficult?.findings?.map((finding: { category: string; statement: string }) => ({
      category: finding.category,
      statement: finding.statement.slice(0, 80),
    })) ?? []),
  );

  const page = await fetch(`${base}/preparations/${interviewId}`, {
    headers: { cookie: `better-auth.session_token=${owner.cookie}` },
  });
  const html = await page.text();
  check("brief page renders", page.status === 200 && !html.includes("Application error") && !html.includes("__next_error__"), String(page.status));
  check("brief shows the style section", html.includes("How this conversation will feel") && html.includes(style?.rationale ?? "missing-rationale"));
  check("brief shows file anchors", html.includes(resumeAnchor) && html.includes(jobAnchor));
  check("brief notes the unreadable file", html.includes("could not be read"));
  check("brief has no difficulty control or payment picker", !html.includes("<select") && !html.includes("Choose a duration") && !html.includes("Pay for"));

  const beforeIds = (readyInterview?.findings ?? []).map((finding: { id: string }) => finding.id);
  check("interview has a finding to remove", beforeIds.length > 0, String(beforeIds.length));
  const removedId = beforeIds[0];
  const correction = await trpc(owner.cookie, "preparations.saveCorrections", {
    id: interviewId,
    corrections: {
      removedFindingIds: [removedId],
      addedFacts: [],
      fieldEdits: [],
    },
  });
  check("removing a finding starts synthesis", correction.payload?.status === "processing", correction.error?.message || "");
  const corrected = await waitUntilSettled(owner.cookie, interviewId);
  const correctedIds = (corrected?.findings ?? []).map((finding: { id: string }) => finding.id);
  check(
    "removing a finding does not research again",
    corrected?.status === "ready" &&
      !correctedIds.includes(removedId) &&
      correctedIds.every((id: string) => beforeIds.includes(id)),
    corrected?.error || correctedIds.join(","),
  );

  const changedCompany = await trpc(owner.cookie, "preparations.updateContext", {
    id: interviewId,
    context: {
      ...interviewContext,
      company: "Figma",
      followUpsSubmitted: true,
    },
  });
  check("company edit saved", changedCompany.payload?.context?.company === "Figma", changedCompany.error?.message || "");
  const rerun = await trpc(owner.cookie, "preparations.rerun", { id: interviewId });
  check("company change reruns research", rerun.payload?.status === "processing" && rerun.payload?.processingStep === "extracting", rerun.error?.message || "");
  const researched = await waitUntilSettled(owner.cookie, interviewId);
  const researchedIds = (researched?.findings ?? []).map((finding: { id: string }) => finding.id);
  check(
    "changing the company replaces findings",
    researched?.status === "ready" &&
      researchedIds.length > 0 &&
      researchedIds.every((id: string) => !correctedIds.includes(id)) &&
      correctedIds.every((id: string) => !researchedIds.includes(id)),
    researched?.error || `before ${correctedIds.length} after ${researchedIds.length}`,
  );

  const third = await trpc(owner.cookie, "preparations.create", {
    conversationType: "job_interview",
    title: "Third interview",
  });
  await trpc(owner.cookie, "preparations.updateContext", {
    id: third.payload.id,
    context: { company: "Notion", jobTitle: "Engineer" },
  });
  const rejected = await trpc(owner.cookie, "preparations.submitFollowUps", {
    id: third.payload.id,
    answers: [],
  });
  check(
    "third unpaid preparation is rejected",
    rejected.error?.data?.code === "FORBIDDEN" &&
      rejected.error?.message === "You already have two preparations waiting for a paid session",
    rejected.error?.message || rejected.payload?.status || "",
  );

  const meetings = await fetch(`${base}/meetings`, {
    headers: { cookie: `better-auth.session_token=${owner.cookie}` },
  });
  check("meetings page still loads", meetings.status === 200, String(meetings.status));
}

async function cleanup() {
  const client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  for (const key of objectKeys) {
    await client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    })).catch(() => undefined);
  }
  for (const id of userIds) {
    await sql`delete from "user" where id = ${id}`;
  }
  await sql`delete from "user" where email like 'phase2-%@wiora.test'`;
}

const started = Date.now();
main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Verification crashed";
    check("verification finished", false, message.slice(0, 180));
  })
  .finally(async () => {
    await cleanup();
    console.log(`elapsed_s ${Math.round((Date.now() - started) / 1000)}`);
    if (failures.length > 0) {
      process.exitCode = 1;
    }
  });
