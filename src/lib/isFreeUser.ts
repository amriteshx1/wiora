import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { getPolarCustomerState } from "@/lib/polar-customer";

export async function isFreeUser(userId: string) {
  try {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));

    if (!existingUser) {
      return true;
    }

    const customer = await getPolarCustomerState({
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
    });

    const subscription = customer.activeSubscriptions?.[0];
    return !subscription;
  } catch (err) {
    console.error("Error checking subscription:", err);
    return true;
  }
};
