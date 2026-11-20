import { createTRPCRouter } from '../init';
import { premiumRouter } from '@/modules/premium/server/procedures';
import { preparationsRouter } from '@/modules/preparations/server/procedures';
import { runsRouter } from '@/modules/preparations/server/runs';

export const appRouter = createTRPCRouter({
  premium: premiumRouter,
  preparations: preparationsRouter,
  runs: runsRouter,
});
export type AppRouter = typeof appRouter;
