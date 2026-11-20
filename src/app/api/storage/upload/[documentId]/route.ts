import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { preparationDocuments } from "@/db/schema";
import { getSession } from "@/lib/session";
import { putObject } from "@/lib/storage";
import { MAX_UPLOAD_BYTES } from "@/modules/preparations/uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function PUT(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;
  const [document] = await db
    .select()
    .from(preparationDocuments)
    .where(eq(preparationDocuments.id, documentId));

  if (!document || document.userId !== session.user.id || document.status !== "pending") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || document.contentType;
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength < 1 || body.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }

  await putObject({
    key: document.objectKey,
    contentType,
    body,
  });

  return new NextResponse(null, { status: 204 });
}
