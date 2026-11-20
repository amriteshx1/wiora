"use client";

import { ColumnDef } from "@tanstack/react-table";

import { preparationListLabels, preparationStatusLabel } from "../../types";

export type PreparationListItem = {
  id: string;
  title: string;
  conversationType: string;
  status: string;
  context?: unknown;
  latestRunStatus?: string | null;
};

export const columns: ColumnDef<PreparationListItem>[] = [
  {
    accessorKey: "title",
    header: "Company",
    cell: ({ row }) => {
      const labels = preparationListLabels(row.original.conversationType, row.original.context);
      return <span className="font-medium">{labels.company}</span>;
    },
  },
  {
    accessorKey: "conversationType",
    header: "Role",
    cell: ({ row }) => {
      const labels = preparationListLabels(row.original.conversationType, row.original.context);
      return <span className="text-sm text-muted-foreground">{labels.role}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-sm">
        {preparationStatusLabel(row.original.status, row.original.latestRunStatus)}
      </span>
    ),
  },
];
