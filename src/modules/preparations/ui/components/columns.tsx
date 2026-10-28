"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { getPack } from "../../types";

export type PreparationListItem = {
  id: string;
  title: string;
  conversationType: string;
  status: string;
};

export const columns: ColumnDef<PreparationListItem>[] = [
  {
    accessorKey: "title",
    header: "Preparation",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "conversationType",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {getPack(row.original.conversationType)?.label ?? row.original.conversationType}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
];
