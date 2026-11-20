import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";

import { getSession } from "@/lib/session";
import { loadSearchParams } from "@/modules/preparations/params";
import { PreparationsListHeader } from "@/modules/preparations/ui/components/preparations-list-header";
import {
  PreparationsView,
  PreparationsViewError,
  PreparationsViewLoading,
} from "@/modules/preparations/ui/views/preparations-view";
import { getQueryClient, trpc } from "@/trpc/server";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const filters = await loadSearchParams(searchParams);
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.preparations.getMany.queryOptions({
      page: filters.page,
      search: filters.search || undefined,
    }),
  );

  return (
    <>
      <PreparationsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PreparationsViewLoading />}>
          <ErrorBoundary fallback={<PreparationsViewError />}>
            <PreparationsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;
