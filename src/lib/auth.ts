import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {polar, checkout, portal, webhooks} from "@polar-sh/better-auth";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { polarClient } from "./polar";
import { applyOrderPaid, applyOrderRefunded } from "@/modules/preparations/server/orders";

export const auth = betterAuth({
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          authenticatedUsersOnly: true,
          successUrl: "/preparations",
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || "",
          onOrderPaid: async (payload) => {
            const order = {
              id: payload.data.id,
              productId: payload.data.productId,
              checkoutId: payload.data.checkoutId,
              metadata: payload.data.metadata,
            };
            after(async () => {
              await applyOrderPaid(order);
            });
          },
          onOrderRefunded: async (payload) => {
            const order = {
              id: payload.data.id,
              productId: payload.data.productId,
              checkoutId: payload.data.checkoutId,
              metadata: payload.data.metadata,
            };
            after(async () => {
              await applyOrderRefunded(order);
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