import { agentsRouter } from '@/modules/agents/server/procedures';

import { createTRPCRouter } from '../init';
import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { premiumRouter } from '@/modules/premium/server/procedures';
import { preparationsRouter } from '@/modules/preparations/server/procedures';

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  premium: premiumRouter,
  preparations: preparationsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;