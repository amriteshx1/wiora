import { auth } from "@/lib/auth";
import { RunCallView } from "@/modules/call/ui/views/run-call-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props{
    params: Promise<{
        meetingId: string;
    }>;
};

const Page = async ({ params }: Props) => {
    const { meetingId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      redirect("/sign-in");
    }

    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(trpc.runs.getOne.queryOptions({ runId: meetingId }));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RunCallView runId={meetingId} />
        </HydrationBoundary>
    );
};

export default Page;
