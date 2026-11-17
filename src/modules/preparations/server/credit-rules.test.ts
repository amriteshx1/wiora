import { describe, expect, it } from "vitest";

import {
  INTERVIEW_MINUTES,
  FREE_PREPARATION_CREDITS,
  PLAN_PREPARATION_CREDITS,
  balanceOf,
  consumeCredit,
  createAtomicBook,
  grantPurchase,
  planForProductId,
  refundPurchase,
  reserveCredit,
  restoreCredit,
  type CreditBook,
} from "./credit-rules";

const env = {
  POLAR_PRODUCT_PRO: "prod_pro",
  POLAR_PRODUCT_PLUS: "prod_plus",
  POLAR_PRODUCT_SUPER: "prod_super",
};

function empty(): CreditBook {
  return { entries: [] };
}

function bought(creditsPlan: "pro" | "plus" | "super", orderId = "order-1"): CreditBook {
  const productId = env[creditsPlan === "pro" ? "POLAR_PRODUCT_PRO" : creditsPlan === "plus" ? "POLAR_PRODUCT_PLUS" : "POLAR_PRODUCT_SUPER"];
  return grantPurchase(empty(), {
    id: orderId,
    userId: "user-1",
    orderId,
    productId,
    env,
  }).book;
}

describe("interview credits", () => {
  it("keeps every interview at 30 minutes", () => {
    expect(INTERVIEW_MINUTES).toBe(30);
  });

  it("maps a Polar product to its credit pack and ignores unknown products", () => {
    expect(planForProductId("prod_pro", env)).toBe("pro");
    expect(planForProductId("prod_plus", env)).toBe("plus");
    expect(planForProductId("prod_super", env)).toBe("super");
    expect(planForProductId("prod_30", env)).toBeNull();
  });

  it("grants 5, 10, and 15 credits from the matching product", () => {
    expect(balanceOf(bought("pro").entries)).toBe(5);
    expect(balanceOf(bought("plus").entries)).toBe(10);
    expect(balanceOf(bought("super").entries)).toBe(15);
  });

  it("keeps interview credits separate from doubled preparation allocations", () => {
    expect(FREE_PREPARATION_CREDITS).toBe(10);
    expect(PLAN_PREPARATION_CREDITS.pro).toBe(10);
    expect(PLAN_PREPARATION_CREDITS.plus).toBe(20);
    expect(PLAN_PREPARATION_CREDITS.super).toBe(30);
  });

  it("does not grant credits for a failed or unknown payment", () => {
    const result = grantPurchase(empty(), {
      id: "missing",
      userId: "user-1",
      orderId: "order-missing",
      productId: "not-a-product",
      env,
    });
    expect(result.granted).toBe(false);
    expect(result.book.entries).toHaveLength(0);
  });

  it("does not grant the same order twice", () => {
    const first = grantPurchase(empty(), {
      id: "a",
      userId: "user-1",
      orderId: "order-1",
      productId: "prod_pro",
      env,
    });
    const second = grantPurchase(first.book, {
      id: "b",
      userId: "user-1",
      orderId: "order-1",
      productId: "prod_pro",
      env,
    });
    expect(second.granted).toBe(false);
    expect(balanceOf(second.book.entries)).toBe(5);
  });

  it("refuses to start an interview without a credit", () => {
    const result = reserveCredit(empty(), "user-1", "run-1");
    expect(result.reserved).toBe(false);
    expect(balanceOf(result.book.entries)).toBe(0);
  });

  it("reserves one credit and does not reserve that interview again", () => {
    const once = reserveCredit(bought("pro"), "user-1", "run-1");
    const twice = reserveCredit(once.book, "user-1", "run-1");
    expect(once.reserved).toBe(true);
    expect(twice.reserved).toBe(true);
    expect(balanceOf(twice.book.entries)).toBe(4);
    expect(twice.book.entries.filter((entry) => entry.runId === "run-1")).toHaveLength(1);
  });

  it("spends the reserved credit when the interview starts, once", () => {
    const held = reserveCredit(bought("pro"), "user-1", "run-1");
    const started = consumeCredit(held.book, "run-1");
    const again = consumeCredit(started.book, "run-1");
    expect(started.consumed).toBe(true);
    expect(again.consumed).toBe(true);
    expect(balanceOf(again.book.entries)).toBe(4);
    expect(again.book.entries.find((entry) => entry.runId === "run-1")?.entryType).toBe("deduction");
  });

  it("lets only one concurrent start spend the last credit", async () => {
    const book = createAtomicBook(bought("pro", "order-last"));
    book.snapshot().entries.splice(0, book.snapshot().entries.length, {
      ...book.snapshot().entries[0],
      delta: 1,
    });
    const results = await Promise.all([
      book.reserve("user-1", "run-a"),
      book.reserve("user-1", "run-b"),
      book.reserve("user-1", "run-c"),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(balanceOf(book.snapshot().entries, "user-1")).toBe(0);
  });

  it("returns a reserved credit when the interview never starts", () => {
    const held = reserveCredit(bought("pro"), "user-1", "run-1");
    const returned = restoreCredit(held.book, "run-1");
    const again = restoreCredit(returned.book, "run-1");
    expect(returned.restored).toBe(true);
    expect(again.restored).toBe(false);
    expect(balanceOf(again.book.entries)).toBe(5);
  });

  it("returns a deducted credit when the start fails, and does not deduct it again", () => {
    const held = reserveCredit(bought("pro"), "user-1", "run-1");
    const started = consumeCredit(held.book, "run-1");
    const returned = restoreCredit(started.book, "run-1");
    const retried = consumeCredit(returned.book, "run-1");
    expect(returned.restored).toBe(true);
    expect(retried.consumed).toBe(false);
    expect(balanceOf(retried.book.entries)).toBe(5);
  });

  it("claws back only unused credits and ignores a second refund", () => {
    const held = reserveCredit(bought("pro"), "user-1", "run-1");
    const refund = refundPurchase(held.book, { id: "refund-1", orderId: "order-1" });
    const duplicate = refundPurchase(refund.book, { id: "refund-2", orderId: "order-1" });
    expect(refund.refunded).toBe(true);
    expect(refund.clawback).toBe(4);
    expect(duplicate.refunded).toBe(false);
    expect(balanceOf(duplicate.book.entries)).toBe(0);
    expect(duplicate.book.entries.some((entry) => entry.runId === "run-1")).toBe(true);
  });

  it("does not put a refunded credit back when that interview never starts", () => {
    const held = reserveCredit(bought("pro"), "user-1", "run-1");
    const refund = refundPurchase(held.book, { id: "refund-1", orderId: "order-1" });
    const returned = restoreCredit(refund.book, "run-1");
    const again = restoreCredit(returned.book, "run-1");
    expect(returned.restored).toBe(true);
    expect(again.restored).toBe(false);
    expect(balanceOf(again.book.entries)).toBe(0);
  });

  it("does not refund an order that never paid", () => {
    const result = refundPurchase(empty(), { id: "refund-1", orderId: "missing" });
    expect(result.refunded).toBe(false);
    expect(result.book.entries).toHaveLength(0);
  });
});
