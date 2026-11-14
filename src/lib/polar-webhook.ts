import { createHmac, timingSafeEqual } from "crypto";

type PolarRecord = Record<string, unknown>;

function asRecord(value: unknown): PolarRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as PolarRecord;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hmacKeys(secret: string): Buffer[] {
  const keys = [Buffer.from(secret, "utf8")];
  if (secret.startsWith("whsec_")) {
    keys.push(Buffer.from(secret.slice("whsec_".length), "base64"));
  }
  return keys;
}

function signaturesMatch(expected: string, provided: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyPolarSignature(
  body: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string,
): void {
  if (!secret) throw new Error("Polar webhook secret not found");
  if (!headers.id || !headers.timestamp || !headers.signature) {
    throw new Error("Missing required headers");
  }
  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp)) throw new Error("Invalid Signature Headers");
  if (Math.abs(Date.now() / 1000 - timestamp) > 5 * 60) {
    throw new Error("Message timestamp too old");
  }

  const signed = `${headers.id}.${headers.timestamp}.${body}`;
  const provided = headers.signature.split(" ").map((item) => (
    item.startsWith("v1,") ? item.slice(3) : item
  ));

  for (const key of hmacKeys(secret)) {
    const expected = createHmac("sha256", key).update(signed).digest("base64");
    if (provided.some((signature) => signaturesMatch(expected, signature))) {
      return;
    }
  }
  throw new Error("No matching signature found");
}

export function polarOrderFields(data: PolarRecord) {
  const metadata = asRecord(data.metadata);
  const customer = asRecord(data.customer);
  const product = asRecord(data.product);
  const userId =
    asString(metadata?.userId) ||
    asString(customer?.externalId) ||
    asString(customer?.external_id);
  const productId =
    asString(data.productId) ||
    asString(data.product_id) ||
    asString(product?.id);
  const checkoutId =
    asString(data.checkoutId) ||
    asString(data.checkout_id) ||
    null;
  return {
    userId,
    orderId: asString(data.id),
    productId,
    checkoutId: checkoutId || null,
  };
}
