import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { polarClient } from "@/lib/polar";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { creditBalance, creditHistory, latestPlan, checkoutProductId } from "@/modules/preparations/server/credits";
import { isPlanId, PLAN_CREDITS } from "@/modules/preparations/server/credit-rules";
import { syncPolarPurchases } from "@/modules/preparations/server/polar-sync";
import { listPlanOffers } from "@/modules/preparations/server/products";

export const premiumRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    let balance = await creditBalance(ctx.auth.user.id);
    if (balance < 1) {
      await syncPolarPurchases(ctx.auth.user.id);
      balance = await creditBalance(ctx.auth.user.id);
    }
    const plan = await latestPlan(ctx.auth.user.id);
    return { balance, plan };
  }),

  getBilling: protectedProcedure.query(async ({ ctx }) => {
    await syncPolarPurchases(ctx.auth.user.id);
    const [balance, plan, plans, history] = await Promise.all([
      creditBalance(ctx.auth.user.id),
      latestPlan(ctx.auth.user.id),
      listPlanOffers(),
      creditHistory(ctx.auth.user.id),
    ]);
    return {
      balance,
      plan,
      creditsInPlan: plan ? PLAN_CREDITS[plan] : 0,
      plans,
      history: history.map((row) => ({
        id: String(row.id),
        delta: Number(row.delta),
        entryType: String(row.entry_type),
        plan: typeof row.plan === "string" ? row.plan : null,
        runId: typeof row.run_id === "string" ? row.run_id : null,
        orderId: typeof row.polar_order_id === "string" ? row.polar_order_id : null,
        checkoutId: typeof row.polar_checkout_id === "string" ? row.polar_checkout_id : null,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(String(row.created_at)).toISOString(),
      })),
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPlanId(input.plan)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown plan" });
      }
      let productId = "";
      try {
        productId = checkoutProductId(input.plan);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "This plan is not configured",
        });
      }
      const offers = await listPlanOffers();
      const offer = offers.find((item) => item.id === input.plan);
      if (!offer || offer.archived) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This plan cannot be purchased" });
      }
      const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const checkout = await polarClient.checkouts.create({
        products: [productId],
        customerExternalId: ctx.auth.user.id,
        metadata: {
          userId: ctx.auth.user.id,
          plan: input.plan,
        },
        successUrl: `${origin}/upgrade?checkout_id={CHECKOUT_ID}`,
      });
      if (!checkout.url) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Checkout could not be opened" });
      }
      return { url: checkout.url };
    }),
});
