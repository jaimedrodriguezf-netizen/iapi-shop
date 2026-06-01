"use client"

import { DataTable } from "@/components/dashboard/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageSquare, CheckCircle, Truck, XCircle, LucideProps } from "lucide-react";
import { updateOrderStatus, Order, OrderStatus } from "@/lib/orders/actions";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";

const statusMap: Record<OrderStatus, { label: string, color: string, icon: React.ComponentType<LucideProps> }> = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500", icon: MessageSquare },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500", icon: CheckCircle },
  shipped: { label: "En Camino", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500", icon: XCircle },
};

export function OrderListClient({ initialOrders, tenantId }: { initialOrders: Order[], tenantId: string }) {
  const [orders, setOrders] = React.useState(initialOrders);

  async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    const res = await updateOrderStatus(tenantId, orderId, newStatus);
    if (res.success) {
      toast.success(`Estado actualizado a ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      toast.error("Error al actualizar estado");
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Orden",
      cell: ({ row }) => <span className="font-mono text-[10px] font-bold uppercase">#{row.getValue("id")?.toString().slice(-6)}</span>,
    },
    {
      accessorKey: "created_at",
      header: "Fecha",
      cell: ({ row }) => {
        const dateValue = row.getValue("created_at")
        const date = typeof dateValue === 'string' ? new Date(dateValue) : new Date()
        return <span className="text-xs text-muted-foreground">{date.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => <span className="font-black text-violet-600">${Number(row.getValue("total_amount")).toFixed(2)}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as OrderStatus;
        const config = statusMap[status] || statusMap.pending;
        const Icon = config.icon;
        return (
          <Badge className={cn("rounded-xl font-bold gap-1", config.color)}>
            <Icon className="h-3 w-3" /> {config.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'confirmed')} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" /> Confirmar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Entregado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'cancelled')} className="gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> Cancelar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={orders} />;
}
