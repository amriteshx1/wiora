import { describe, expect, it } from "vitest";

import { grantInputFromOrder, paidOrdersFromPages } from "./polar-orders";

const owner = { metadata: { userId: "user_1" } };

describe("polar purchase sync", () => {
  it("grants only paid Polar orders that belong to the user", () => {
    const paid = paidOrdersFromPages([
      {
        result: {
          items: [
            { id: "ord_open", paid: false, productId: "prod_plus", ...owner },
            { id: "ord_paid", paid: true, productId: "prod_plus", checkoutId: "chk_1", ...owner },
            { id: "ord_other", paid: true, productId: "prod_plus", metadata: { userId: "user_2" } },
          ],
        },
      },
    ]);
    expect(paid.map((order) => order.id)).toEqual(["ord_paid", "ord_other"]);
    expect(grantInputFromOrder(paid[0], "user_1")).toEqual({
      userId: "user_1",
      orderId: "ord_paid",
      productId: "prod_plus",
      checkoutId: "chk_1",
    });
    expect(grantInputFromOrder(paid[1], "user_1")).toBeNull();
  });

  it("reads snake_case Polar order fields", () => {
    expect(grantInputFromOrder({
      id: "ord_snake",
      paid: true,
      product_id: "prod_plus",
      checkout_id: "chk_2",
      customer: { external_id: "user_1" },
    }, "user_1")).toEqual({
      userId: "user_1",
      orderId: "ord_snake",
      productId: "prod_plus",
      checkoutId: "chk_2",
    });
  });

  it("reads Polar pages that return items at the top level", () => {
    expect(paidOrdersFromPages([
      { items: [{ id: "ord_top", paid: true, product: { id: "prod_plus" }, ...owner }] },
    ]).map((order) => grantInputFromOrder(order, "user_1"))).toEqual([{
      userId: "user_1",
      orderId: "ord_top",
      productId: "prod_plus",
      checkoutId: null,
    }]);
  });

  it("treats Polar status paid as paid", () => {
    expect(grantInputFromOrder({
      id: "ord_status",
      status: "paid",
      productId: "prod_plus",
      ...owner,
    }, "user_1")?.orderId).toBe("ord_status");
  });
});
