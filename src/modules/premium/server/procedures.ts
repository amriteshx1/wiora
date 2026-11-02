import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { sessionProducts } from "@/modules/preparations/server/products";

export const premiumRouter = createTRPCRouter({
  getSessionProducts: protectedProcedure.query(async () => {
    return sessionProducts();
  }),
});
