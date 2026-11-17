import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {polar, checkout, portal} from "@polar-sh/better-auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { grantFreePreparationCredits } from "@/modules/preparations/server/preparation-credits";
import { polarClient } from "./polar";

export const auth = betterAuth({
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          try {
            await grantFreePreparationCredits(created.id);
          } catch (error) {
            console.error("Free preparation grant failed", error);
          }
        },
      },
    },
  },
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