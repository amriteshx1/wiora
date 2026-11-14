import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';

import { getSession } from '@/lib/session';

export const createTRPCContext = cache(async () => {
  return { auth: await getSession() };
});

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.auth) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, auth: ctx.auth } });
});
