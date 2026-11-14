import { NextResponse } from "next/server";

import { polarOrderFields, verifyPolarSignature } from "@/lib/polar-webhook";
import { grantCredits, refundCredits } from "@/modules/preparations/server/credits";

export async function POST(request: Request) {
  const body = await request.text();
  try {
    verifyPolarSignature(
      body,
      {
        id: request.headers.get("webhook-id") ?? "",
        timestamp: request.headers.get("webhook-timestamp") ?? "",
        signature: request.headers.get("webhook-signature") ?? "",
      },
      process.env.POLAR_WEBHOOK_SECRET || "",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook Error";
    console.error(`Polar webhook: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(body) as { type?: string; data?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type === "order.paid" && event.data) {
    const order = polarOrderFields(event.data);
    if (!order.userId) {
      console.error("Paid order has no user");
    } else if (!order.orderId || !order.productId) {
      console.error("Paid order is missing identifiers");
    } else {
      await grantCredits(order);
    }
  }

  if (event.type === "order.refunded" && event.data) {
    const order = polarOrderFields(event.data);
    if (order.orderId) {
      await refundCredits({
        orderId: order.orderId,
        productId: order.productId,
        checkoutId: order.checkoutId,
      });
    }
  }

  return NextResponse.json({ received: true });
}
