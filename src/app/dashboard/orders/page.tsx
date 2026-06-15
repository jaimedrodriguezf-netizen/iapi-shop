import { ensureUserTenant } from "@/lib/tenants/actions";
import { getTenantOrders } from "@/lib/orders/actions";
import { redirect } from "next/navigation";
import { OrderListClient } from "@/components/dashboard/order-list-client";

export default async function OrdersPage() {
  const tenantResult = await ensureUserTenant();

  if (!tenantResult.success || !tenantResult.data) {
    redirect("/login");
  }

  const tenantId = tenantResult.data.id;
  const ordersResult = await getTenantOrders(tenantId);
  const initialOrders = ordersResult.success && ordersResult.data ? ordersResult.data : [];

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-orange-500">Gestión de Órdenes</h1>
        <p className="text-muted-foreground italic">Historial de pedidos recibidos desde tu catálogo digital.</p>
      </header>
      
      <div className="rounded-3xl border bg-background p-6 shadow-sm">
        <OrderListClient initialOrders={initialOrders} tenantId={tenantId} />
      </div>
    </section>
  );
}
