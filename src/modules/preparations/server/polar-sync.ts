import { polarClient } from "@/lib/polar";
import { grantCredits } from "./credits";
import {
  grantInputFromOrder,
  paidOrdersFromPages,
  type PolarOrderPage,
} from "./polar-orders";

const POLAR_TIMEOUT_MS = 8000;
const inflight = new Map<string, Promise<number>>();

async function grantPaidOrders(userId: string): Promise<number> {
  let customer;
  try {
    customer = await polarClient.customers.getExternal(
      { externalId: userId },
      { timeoutMs: POLAR_TIMEOUT_MS },
    );
  } catch {
    return 0;
  }

  const pages: PolarOrderPage[] = [];
  const result = await polarClient.orders.list(
    {
      customerId: customer.id,
      limit: 100,
    },
    { timeoutMs: POLAR_TIMEOUT_MS },
  );
  for await (const page of result) {
    pages.push(page);
  }

  let granted = 0;
  for (const order of paidOrdersFromPages(pages)) {
    const input = grantInputFromOrder(order, userId);
    if (!input) continue;
    if (await grantCredits(input)) granted += 1;
  }
  return granted;
}

export async function syncPolarPurchases(userId: string): Promise<number> {
  const existing = inflight.get(userId);
  if (existing) return existing;
  const job = grantPaidOrders(userId).catch((error) => {
    console.error("Polar purchase sync failed", error);
    return 0;
  }).finally(() => {
    setTimeout(() => inflight.delete(userId), 4000);
  });
  inflight.set(userId, job);
  return job;
}
