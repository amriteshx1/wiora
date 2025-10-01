import { eq, count } from "drizzle-orm";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";

import { polarClient } from "@/lib/polar";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const premiumRouter = createTRPCRouter({
    getFreeUsage: protectedProcedure.query(async ({ ctx }) => {
        const customer = await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });

        const subscription = customer.activeSubscriptions[0];

        if(subscription){
            return null;
        }

        const [userMeetings] = await db 
          .select({
            count: count(meetings.id),
          })
          .from(meetings)
          .where(eq(meetings.userId, ctx.auth.user.id));

        const [userAgents] = await db 
          .select({
            count: count(agents.id),
          })
          .from(agents)
          .where(eq(agents.userId, ctx.auth.user.id));

        return {
            meetingCount: userMeetings.count,
            agentCount: userAgents.count,
        };
    })
});