"use client";

import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";

import { DataPagination } from "@/components/data-pagination";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
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

  if (data.items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-start gap-4 px-4 py-10 md:px-8">
        <p className="text-lg font-medium">
          {filters.search ? "No preparations match that search" : "Start a preparation"}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {filters.search
            ? "Try another title, or start a new one"
            : "Choose the conversation you are getting ready for, then add the details and files you already have"}
        </p>
        <Button asChild>
          <Link href="/preparations/new">New preparation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-y-4 px-4 pb-4 md:px-8">
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
    </div>
  );
};

export const PreparationsViewLoading = () => {
  return (
    <LoadingState
      title="Loading preparations"
      description="Opening your conversations"
    />
  );
};

export const PreparationsViewError = () => {
  return (
    <ErrorState
      title="Could not load preparations"
      description="Refresh the page and try again"
    />
  );
};
