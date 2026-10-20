import { polarClient } from "@/lib/polar";

export async function isFreeUser(userId: string) {
  try {
    const customer = await polarClient.customers.getStateExternal({
      externalId: userId,
    });

    const subscription = customer.activeSubscriptions?.[0];
    return !subscription;
  } catch (err) {
    console.error("Error checking subscription:", err);
    return true;
  }
};
