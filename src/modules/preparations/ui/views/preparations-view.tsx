"use client";

import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";

import { DataPagination } from "@/components/data-pagination";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";

import { usePreparationsFilters } from "../../hooks/use-preparations-filters";
import { columns } from "../components/columns";

export const PreparationsView = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const [filters, setFilters] = usePreparationsFilters();
  const { data } = useSuspenseQuery(
    trpc.preparations.getMany.queryOptions({
      page: filters.page,
      pageSize: 10,
      search: filters.search || undefined,
    }),
  );

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        data={data.items}
        columns={columns}
        onRowClick={(row) => router.push(`/preparations/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
      {data.items.length === 0 ? (
        <EmptyState
          title="Start a preparation"
          description="Choose the conversation you are getting ready for. Add the details and files you already have."
        />
      ) : null}
    </div>
  );
};

export const PreparationsViewLoading = () => {
  return (
    <LoadingState
      title="Loading preparations"
      description="This may take a few seconds"
    />
  );
};

export const PreparationsViewError = () => {
  return (
    <ErrorState
      title="Could not load preparations"
      description="Refresh the page and try again."
    />
  );
};
