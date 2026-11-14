import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getSession } from "@/lib/session";
import {
  UpgradeView,
  UpgradeViewError,
  UpgradeViewLoading,
} from "@/modules/premium/ui/views/upgrade-view";
import { getQueryClient, trpc } from "@/trpc/server";

const Page = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.premium.getBilling.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<UpgradeViewLoading />}>
        <ErrorBoundary fallback={<UpgradeViewError />}>
          <UpgradeView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
