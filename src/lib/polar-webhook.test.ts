import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { isPaidOrderEvent, polarOrderFields, verifyPolarSignature } from "./polar-webhook";

const secret = `whsec_${Buffer.from("wiora-polar-webhook-test-secret").toString("base64")}`;
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

  it("reads a nested Polar product id", () => {
    expect(polarOrderFields({
      id: "ord_2",
      product: { id: "prod_plus" },
      customer: { external_id: "user_2" },
    })).toEqual({
      userId: "user_2",
      orderId: "ord_2",
      productId: "prod_plus",
      checkoutId: null,
    });
  });

  it("grants on order.paid and on a later paid order.updated", () => {
    expect(isPaidOrderEvent("order.paid", { id: "ord_1" })).toBe(true);
    expect(isPaidOrderEvent("order.updated", { id: "ord_1", paid: true })).toBe(true);
    expect(isPaidOrderEvent("order.updated", { id: "ord_1", status: "paid" })).toBe(true);
    expect(isPaidOrderEvent("order.updated", { id: "ord_1", paid: false })).toBe(false);
    expect(isPaidOrderEvent("order.created", { id: "ord_1", paid: true })).toBe(false);
  });
});
