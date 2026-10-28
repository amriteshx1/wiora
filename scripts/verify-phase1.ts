import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import {
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { preparationPacks, limitFollowUps, type IntakeContext } from "../src/modules/preparations/types";
import { uploadRejection, MAX_UPLOAD_BYTES } from "../src/modules/preparations/uploads";

const sql = neon(process.env.DATABASE_URL!);
const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures.push(detail ? `${name}: ${detail}` : name);
    console.log("FAIL", name, detail);
    return;
  }
  console.log("PASS", name);
}

function filled(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const encoded = Buffer.from(signature).toString("base64");
  return encodeURIComponent(`${token}.${encoded}`);
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
    body = { raw: text.slice(0, 300) };
  }
  return {
    status: response.status,
    payload: body?.result?.data,
    error: body?.error,
    body,
  };
}

function unitChecks() {
  const none: string[] = [];
  const interview = preparationPacks.job_interview;
  check("interview empty blocked", !interview.hasMinimum({}, none));
  check("interview company only blocked", !interview.hasMinimum({ company: "Acme" }, none));
  check("interview whitespace blocked", !interview.hasMinimum({ company: "  ", jobTitle: "Engineer" }, none));
  check("interview title allowed", interview.hasMinimum({ company: "Acme", jobTitle: "Engineer" }, none));
  check("interview description allowed", interview.hasMinimum({ company: "Acme", jobDescription: "Build systems" }, none));
  check(
    "interview resume without ready id blocked",
    !interview.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "resume" }] }, none),
  );
  check(
    "interview resume allowed",
    interview.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "resume" }] }, ["doc"]),
  );
  check(
    "interview extra file is not a resume",
    !interview.hasMinimum({ company: "Acme", documents: [{ id: "doc", slot: "extra" }] }, ["doc"]),
  );

  const investor = preparationPacks.investor_pitch;
  check("investor empty blocked", !investor.hasMinimum({}, none));
  check("investor description allowed", investor.hasMinimum({ startupDescription: "We sell tools" }, none));
  check(
    "investor deck allowed",
    investor.hasMinimum({ documents: [{ id: "deck", slot: "deck" }] }, ["deck"]),
  );
  check(
    "investor pending deck blocked",
    !investor.hasMinimum({ documents: [{ id: "deck", slot: "deck" }] }, none),
  );

  const sales = preparationPacks.sales_call;
  check("sales client only blocked", !sales.hasMinimum({ client: "Northwind" }, none));
  check("sales product allowed", sales.hasMinimum({ client: "Northwind", product: "Platform" }, none));
  check(
    "sales proposal allowed",
    sales.hasMinimum({ client: "Northwind", documents: [{ id: "p", slot: "proposal" }] }, ["p"]),
  );
  check(
    "sales supporting file is not a proposal",
    !sales.hasMinimum({ client: "Northwind", documents: [{ id: "p", slot: "supporting" }] }, ["p"]),
  );

  check("negotiation subject only blocked", !preparationPacks.negotiation.hasMinimum({ subject: "Price" }, none));
  check(
    "negotiation allowed",
    preparationPacks.negotiation.hasMinimum({ subject: "Price", desiredOutcome: "Close at 10" }, none),
  );
  check("leadership situation only blocked", !preparationPacks.leadership.hasMinimum({ situation: "Late work" }, none));
  check(
    "leadership allowed",
    preparationPacks.leadership.hasMinimum({ situation: "Late work", desiredOutcome: "A new deadline" }, none),
  );
  check(
    "difficult uses its own pack",
    preparationPacks.difficult_conversation.id === "difficult_conversation" &&
      preparationPacks.difficult_conversation.label !== preparationPacks.leadership.label,
  );
  check(
    "difficult allowed",
    preparationPacks.difficult_conversation.hasMinimum({ situation: "Missed commitment", desiredOutcome: "A repair" }, none),
  );
  check("custom empty blocked", !preparationPacks.custom.hasMinimum({}, none));
  check("custom whitespace blocked", !preparationPacks.custom.hasMinimum({ description: "   " }, none));
  check("custom allowed", preparationPacks.custom.hasMinimum({ description: "A board update" }, none));
  check("custom has no fixed dimensions", preparationPacks.custom.evaluationDimensions.length === 0);
  check("follow-ups capped at three", limitFollowUps([1, 2, 3, 4, 5]).length === 3);

  const parsed = preparationPacks.job_interview.schema.parse({
    company: "Acme",
    notAField: "drop me",
  }) as IntakeContext;
  check("unknown intake keys stripped", filled(parsed.company) === "Acme" && !("notAField" in parsed));

  check("30mb rejected", uploadRejection("application/pdf", 30 * 1024 * 1024) !== null);
  check("over exact 25mb rejected", uploadRejection("application/pdf", MAX_UPLOAD_BYTES + 1) !== null);
  check("25mb pdf allowed", uploadRejection("application/pdf", MAX_UPLOAD_BYTES) === null);
  check("zip rejected", uploadRejection("application/zip", 1000) !== null);
  check("empty file rejected", uploadRejection("application/pdf", 0) !== null);

  const inngest = readFileSync("src/app/api/inngest/route.ts", "utf8");
  check(
    "inngest functions unchanged",
    inngest.includes("meetingsProcessing") &&
      inngest.includes("meetingTimeoutEnd") &&
      inngest.includes("smartFollowUp") &&
      !inngest.includes("preparations/process"),
  );
  const procedures = readFileSync("src/modules/preparations/server/procedures.ts", "utf8");
  check("submit does not send inngest", !procedures.includes("inngest"));
  const sidebar = readFileSync("src/modules/dashboard/ui/components/dashboard-sidebar.tsx", "utf8");
  check(
    "sidebar keeps old items and adds preparations",
    sidebar.includes("Preparations") &&
      sidebar.includes("Meetings") &&
      sidebar.includes("Agents") &&
      sidebar.includes("Upgrade"),
  );
}

async function createSession(label: string) {
  const id = `p1${label}${Date.now().toString(36)}`;
  const email = `phase1-${label}-${Date.now()}@wiora.test`;
  const token = `p1${label}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.slice(0, 32);
  await sql`
    insert into "user" (id, name, email, email_verified, created_at, updated_at)
    values (${id}, ${label}, ${email}, false, now(), now())
  `;
  await sql`
    insert into "session" (id, expires_at, token, created_at, updated_at, user_id)
    values (${id + "s"}, now() + interval '1 day', ${token}, now(), now(), ${id})
  `;
  const cookie = await signCookie(token, process.env.BETTER_AUTH_SECRET!);
  return { id, cookie };
}

async function main() {
  unitChecks();
  const owner = await createSession("a");
  const other = await createSession("b");
  try {
    const types = [
      ["job_interview", "Job interview"],
      ["investor_pitch", "Investor pitch"],
      ["sales_call", "Sales call"],
      ["negotiation", "Negotiation"],
      ["leadership", "Leadership conversation"],
      ["difficult_conversation", "Difficult conversation"],
      ["custom", "Custom conversation"],
    ] as const;

    const created: Record<string, string> = {};
    for (const [type, title] of types) {
      const result = await trpc(owner.cookie, "preparations.create", { conversationType: type, title });
      created[type] = result.payload?.id;
      check(`create ${type}`, Boolean(result.payload?.id) && result.payload.status === "draft", result.error?.message || "");
    }

    for (const type of Object.keys(created)) {
      const blocked = await trpc(owner.cookie, "preparations.submitFollowUps", { id: created[type], answers: [] });
      check(`submit blocked ${type}`, blocked.error?.data?.code === "BAD_REQUEST", blocked.error?.message || JSON.stringify(blocked.body).slice(0, 200));
    }

    const interviewCompany = await trpc(owner.cookie, "preparations.updateContext", {
      id: created.job_interview,
      context: { company: "Acme", ignored: "no" },
    });
    check("interview company saved", interviewCompany.payload?.context?.company === "Acme");
    check("unknown context key stripped", interviewCompany.payload?.context?.ignored === undefined);
    const interviewBlocked = await trpc(owner.cookie, "preparations.requestFollowUps", { id: created.job_interview });
    check("interview company-only blocked", interviewBlocked.error?.message === "Add the required context before continuing", interviewBlocked.error?.message || "");

    const tooBig = await trpc(owner.cookie, "preparations.createUpload", {
      preparationId: created.job_interview,
      fileName: "huge.pdf",
      contentType: "application/pdf",
      byteSize: 30 * 1024 * 1024,
    });
    check("api rejects 30mb", tooBig.error?.data?.code === "BAD_REQUEST", tooBig.error?.message || "");

    const badType = await trpc(owner.cookie, "preparations.createUpload", {
      preparationId: created.job_interview,
      fileName: "notes.zip",
      contentType: "application/zip",
      byteSize: 1200,
    });
    check("api rejects zip", badType.error?.data?.code === "BAD_REQUEST", badType.error?.message || "");

    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    const upload = await trpc(owner.cookie, "preparations.createUpload", {
      preparationId: created.job_interview,
      fileName: "resume.pdf",
      contentType: "application/pdf",
      byteSize: pdf.length,
    });
    check("presign upload", typeof upload.payload?.uploadUrl === "string" && upload.payload.uploadUrl.startsWith(process.env.S3_ENDPOINT!), upload.error?.message || "");

    if (upload.payload?.uploadUrl) {
      const put = await fetch(upload.payload.uploadUrl, {
        method: "PUT",
        headers: { "content-type": "application/pdf" },
        body: pdf,
      });
      check("pdf put", put.ok, `${put.status} ${await put.text()}`);
      const confirmed = await trpc(owner.cookie, "preparations.confirmUpload", { documentId: upload.payload.documentId });
      check(
        "confirm keeps text empty",
        confirmed.payload?.status === "ready" && confirmed.payload?.extractedText === "" && confirmed.payload?.reading == null,
        confirmed.error?.message || "",
      );

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
      const head = await client.send(new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: confirmed.payload.objectKey,
      }));
      check("object exists", head.ContentLength === pdf.length, String(head.ContentLength));

      const anonymous = await fetch(`${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${confirmed.payload.objectKey}`);
      check("bucket stays private", anonymous.status === 403, String(anonymous.status));

      const ownerUrl = await trpc(owner.cookie, "preparations.getDocumentUrl", { documentId: upload.payload.documentId }, "GET");
      check("owner url", typeof ownerUrl.payload?.url === "string", ownerUrl.error?.message || "");
      if (ownerUrl.payload?.url) {
        const downloaded = await fetch(ownerUrl.payload.url);
        const bytes = Buffer.from(await downloaded.arrayBuffer());
        check("owner download", downloaded.ok && bytes.equals(pdf), String(downloaded.status));
        const stored = await sql`select context from preparations where id = ${created.job_interview}`;
        check("signed url is not stored", !JSON.stringify(stored[0].context).includes(ownerUrl.payload.url));
      }
      const otherUrl = await trpc(other.cookie, "preparations.getDocumentUrl", { documentId: upload.payload.documentId }, "GET");
      check("other user rejected", otherUrl.error?.data?.code === "NOT_FOUND", otherUrl.error?.message || JSON.stringify(otherUrl.body).slice(0, 180));

      await trpc(owner.cookie, "preparations.updateContext", {
        id: created.job_interview,
        context: {
          company: "Acme",
          documents: [{ id: upload.payload.documentId, slot: "resume" }],
        },
      });
      const interviewQuestions = await trpc(owner.cookie, "preparations.requestFollowUps", { id: created.job_interview });
      const questions = interviewQuestions.payload?.questions;
      check(
        "interview follow-ups at most three",
        Array.isArray(questions) && questions.length <= 3,
        interviewQuestions.error?.message || JSON.stringify(questions),
      );
      const skipped = await trpc(owner.cookie, "preparations.submitFollowUps", { id: created.job_interview, answers: [] });
      check(
        "skip saves draft",
        skipped.payload?.status === "draft" && skipped.payload?.context?.followUpsSubmitted === true && Array.isArray(skipped.payload?.context?.followUps) && skipped.payload.context.followUps.length === 0,
        skipped.error?.message || "",
      );
    }

    const contexts: Record<string, IntakeContext> = {
      investor_pitch: { startupDescription: "A tools company" },
      sales_call: { client: "Northwind", product: "Platform" },
      negotiation: { subject: "Renewal price", desiredOutcome: "Hold the current rate" },
      leadership: { situation: "A missed launch", desiredOutcome: "A new date the team accepts" },
      difficult_conversation: { situation: "A broken commitment", desiredOutcome: "A specific repair" },
      custom: { description: "A board update next week" },
    };
    for (const [type, context] of Object.entries(contexts)) {
      await trpc(owner.cookie, "preparations.updateContext", { id: created[type], context });
      const saved = await trpc(owner.cookie, "preparations.submitFollowUps", { id: created[type], answers: [] });
      check(
        `skip saves ${type}`,
        saved.payload?.status === "draft" && saved.payload?.context?.followUpsSubmitted === true,
        saved.error?.message || "",
      );
    }

    const salesClientOnly = await trpc(owner.cookie, "preparations.create", {
      conversationType: "sales_call",
      title: "Sales minimum",
    });
    await trpc(owner.cookie, "preparations.updateContext", {
      id: salesClientOnly.payload.id,
      context: { client: "Northwind" },
    });
    const salesBlocked = await trpc(owner.cookie, "preparations.submitFollowUps", {
      id: salesClientOnly.payload.id,
      answers: [],
    });
    check("sales client-only blocked", salesBlocked.error?.message === "Add the required context before continuing");

    const investorEmpty = await trpc(owner.cookie, "preparations.create", {
      conversationType: "investor_pitch",
      title: "Deck minimum",
    });
    const investorBlocked = await trpc(owner.cookie, "preparations.submitFollowUps", {
      id: investorEmpty.payload.id,
      answers: [],
    });
    check("investor empty blocked on server", investorBlocked.error?.data?.code === "BAD_REQUEST");

    const deckPdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    const deckUpload = await trpc(owner.cookie, "preparations.createUpload", {
      preparationId: investorEmpty.payload.id,
      fileName: "deck.pdf",
      contentType: "application/pdf",
      byteSize: deckPdf.length,
    });
    const deckPut = await fetch(deckUpload.payload.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: deckPdf,
    });
    check("deck put", deckPut.ok, String(deckPut.status));
    await trpc(owner.cookie, "preparations.confirmUpload", { documentId: deckUpload.payload.documentId });
    await trpc(owner.cookie, "preparations.updateContext", {
      id: investorEmpty.payload.id,
      context: { documents: [{ id: deckUpload.payload.documentId, slot: "deck" }] },
    });
    const deckSaved = await trpc(owner.cookie, "preparations.submitFollowUps", {
      id: investorEmpty.payload.id,
      answers: [],
    });
    check("deck alone meets investor minimum", deckSaved.payload?.status === "draft" && deckSaved.payload?.context?.followUpsSubmitted === true, deckSaved.error?.message || "");

    const proposalPrep = await trpc(owner.cookie, "preparations.create", {
      conversationType: "sales_call",
      title: "Proposal minimum",
    });
    await trpc(owner.cookie, "preparations.updateContext", {
      id: proposalPrep.payload.id,
      context: { client: "Northwind" },
    });
    const proposalUpload = await trpc(owner.cookie, "preparations.createUpload", {
      preparationId: proposalPrep.payload.id,
      fileName: "proposal.pdf",
      contentType: "application/pdf",
      byteSize: deckPdf.length,
    });
    await fetch(proposalUpload.payload.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: deckPdf,
    });
    await trpc(owner.cookie, "preparations.confirmUpload", { documentId: proposalUpload.payload.documentId });
    const stillBlocked = await trpc(owner.cookie, "preparations.submitFollowUps", {
      id: proposalPrep.payload.id,
      answers: [],
    });
    check("proposal file without slot still blocked", stillBlocked.error?.data?.code === "BAD_REQUEST");
    await trpc(owner.cookie, "preparations.updateContext", {
      id: proposalPrep.payload.id,
      context: {
        client: "Northwind",
        documents: [{ id: proposalUpload.payload.documentId, slot: "proposal" }],
      },
    });
    const proposalSaved = await trpc(owner.cookie, "preparations.submitFollowUps", {
      id: proposalPrep.payload.id,
      answers: [],
    });
    check("proposal meets sales minimum", proposalSaved.payload?.context?.followUpsSubmitted === true, proposalSaved.error?.message || "");

    const list = await trpc(owner.cookie, "preparations.getMany", { page: 1, search: "Job interview" }, "GET");
    check(
      "list shape",
      Array.isArray(list.payload?.items) && typeof list.payload?.total === "number" && typeof list.payload?.totalPages === "number",
      list.error?.message || "",
    );
    const agents = await trpc(owner.cookie, "agents.getMany", { page: 1 }, "GET");
    const meetings = await trpc(owner.cookie, "meetings.getMany", { page: 1 }, "GET");
    check("agents still load", Array.isArray(agents.payload?.items), agents.error?.message || JSON.stringify(agents.body).slice(0, 180));
    check("meetings still load", Array.isArray(meetings.payload?.items), meetings.error?.message || JSON.stringify(meetings.body).slice(0, 180));

    for (const path of ["/preparations", "/preparations/new", "/meetings", "/agents"]) {
      const response = await fetch(`${base}${path}`, { redirect: "manual" });
      check(`${path} redirects unsigned users`, response.status >= 300 && response.status < 400, String(response.status));
    }
  } finally {
    await sql`delete from "user" where email like 'phase1-%@wiora.test'`;
  }

  if (failures.length) {
    console.log(`\n${failures.length} failed`);
    process.exit(1);
  }
  console.log("\nAll phase 1 checks passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
