"use client"

import { DataTable } from "@/components/dashboard/data-table";
import { ColumnDef } from "@tanstack/react-table";

export type ShopSummary = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

const columns: ColumnDef<ShopSummary>[] = [
  {
    accessorKey: "name",
    header: "Sucursal",
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        {row.getValue("status")}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Fecha de Creación",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <span className="text-muted-foreground text-xs">{date.toLocaleDateString()}</span>
    },
  },
];

export function ShopSummaryTable({ data }: { data: ShopSummary[] }) {
  return (
    <div className="rounded-3xl border bg-background p-6 shadow-sm h-full">
      <h3 className="font-black text-lg mb-4">Resumen de Sucursales</h3>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
