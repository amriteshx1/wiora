"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

import { usePreparationsFilters } from "../../hooks/use-preparations-filters";

export const PreparationsSearchFilter = () => {
  const [filters, setFilters] = usePreparationsFilters();

  return (
    <div className="relative">
      <Input
        placeholder="Filter by title"
        className="h-9 bg-white w-[200px] pl-7"
        value={filters.search}
        onChange={(event) => setFilters({ search: event.target.value, page: 1 })}
      />
      <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
};
