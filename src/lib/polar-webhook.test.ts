import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { polarOrderFields, verifyPolarSignature } from "./polar-webhook";

const secret = "whsec_WytTCUm/q8T/IHQT5ffLIYodr6TH4oK9PgE0PYdeT6I=";
const body = JSON.stringify({ type: "order.paid", data: { id: "ord_1" } });
const id = "msg_1";
const timestamp = String(Math.floor(Date.now() / 1000));

function sign(key: Buffer) {
  return `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")}`;
}

describe("polar webhook signatures", () => {
  it("accepts Polar HMAC secrets used by the 0.x SDK", () => {
    expect(() => verifyPolarSignature(body, {
      id,
      timestamp,
      signature: sign(Buffer.from(secret, "utf8")),
    }, secret)).not.toThrow();
  });

  it("accepts Standard Webhooks secrets Polar generates now", () => {
    expect(() => verifyPolarSignature(body, {
      id,
      timestamp,
      signature: sign(Buffer.from(secret.slice("whsec_".length), "base64")),
    }, secret)).not.toThrow();
  });

  it("rejects a signature from another secret", () => {
    expect(() => verifyPolarSignature(body, {
      id,
      timestamp,
      signature: sign(Buffer.from("other-secret", "utf8")),
    }, secret)).toThrow("No matching signature found");
  });

  it("reads snake_case Polar order fields", () => {
    expect(polarOrderFields({
      id: "ord_1",
      product_id: "prod_plus",
      checkout_id: "chk_1",
      metadata: { userId: "user_1" },
      customer: { external_id: "ignored" },
    })).toEqual({
      userId: "user_1",
      orderId: "ord_1",
      productId: "prod_plus",
      checkoutId: "chk_1",
    });
  });
});
