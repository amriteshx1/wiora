import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { auth } from "@/lib/auth";
import {
  PreparationWorkspaceError,
  PreparationWorkspaceLoading,
  PreparationWorkspaceView,
} from "@/modules/preparations/ui/views/preparation-workspace-view";
import { getQueryClient, trpc } from "@/trpc/server";

interface Props {
  params: Promise<{
    preparationId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { preparationId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.preparations.getOne.queryOptions({ id: preparationId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PreparationWorkspaceLoading />}>
        <ErrorBoundary fallback={<PreparationWorkspaceError />}>
          <PreparationWorkspaceView preparationId={preparationId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
