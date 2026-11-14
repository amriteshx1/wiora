import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {polar, checkout, portal, webhooks} from "@polar-sh/better-auth";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { polarClient } from "./polar";
import { grantCredits, refundCredits } from "@/modules/preparations/server/credits";

function orderUserId(metadata: Record<string, string | number | boolean> | null | undefined, externalId: string | null | undefined) {
  if (typeof metadata?.userId === "string" && metadata.userId) return metadata.userId;
  return externalId || "";
}

export const auth = betterAuth({
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          authenticatedUsersOnly: true,
          successUrl: "/upgrade",
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || "",
          onOrderPaid: async (payload) => {
            const metadata = payload.data.metadata ?? null;
            const externalId = payload.data.customer?.externalId ?? null;
            const userId = orderUserId(metadata, externalId);
            const order = {
              userId,
              orderId: payload.data.id,
              productId: payload.data.productId,
              checkoutId: payload.data.checkoutId,
            };
            after(async () => {
              if (!order.userId) {
                console.error("Paid order has no user");
                return;
              }
              await grantCredits(order);
            });
          },
          onOrderRefunded: async (payload) => {
            const order = {
              orderId: payload.data.id,
              productId: payload.data.productId,
              checkoutId: payload.data.checkoutId,
            };
            after(async () => {
              await refundCredits(order);
            });
          },
        }),
      ],
    }),
  ],
  socialProviders: {
      github: { 
        clientId: process.env.GITHUB_CLIENT_ID as string, 
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
      }, 
      google: { 
          clientId: process.env.GOOGLE_CLIENT_ID as string, 
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
      },
  },
  emailAndPassword: {
    enabled: true, 
  }, 
  database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...schema,
      }
  }),
});