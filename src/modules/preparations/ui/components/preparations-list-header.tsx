"use client";

import Link from "next/link";
import { PlusIcon, XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE } from "@/constants";

import { usePreparationsFilters } from "../../hooks/use-preparations-filters";
import { PreparationsSearchFilter } from "./preparations-search-filter";

export const PreparationsListHeader = () => {
  const [filters, setFilters] = usePreparationsFilters();

  return (
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-xl">Preparations</h5>
        <Button asChild>
          <Link href="/preparations/new">
            <PlusIcon />
            New preparation
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-x-2">
        <PreparationsSearchFilter />
        {filters.search ? (
          <Button
            variant="outline"
            onClick={() => setFilters({ search: "", page: DEFAULT_PAGE })}
          >
            <XCircleIcon className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
};
