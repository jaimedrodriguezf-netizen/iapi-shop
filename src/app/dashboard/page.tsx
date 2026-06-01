import Link from "next/link";
import { SampleSalesChart } from "@/components/dashboard/sample-chart";
import { ShopSummaryTable, ShopSummary } from "@/components/dashboard/shop-summary-table";
import { getTenantOrders } from "@/lib/orders/actions";
import { getMyTenants, getTenantSubscription } from "@/lib/tenants/actions";
import { getUserRoleInfo } from "@/lib/auth/actions";

export default async function DashboardPage() {
  // 1. Obtener datos del usuario delegando a Server Action (GGA Compliance)
  const roleResult = await getUserRoleInfo();
  const platformRole = roleResult.success && roleResult.data ? roleResult.data.platformRole : "merchant";

  // 2. Fetch de sucursales delegando a Server Action (GGA Clean Architecture)
  const tenantsResult = await getMyTenants();
  const tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : [];

  const sucursales: ShopSummary[] = tenants.map(t => ({
    id: t.id,
    name: t.name,
    status: t.status === "active" ? "Activa" : t.status,
    created_at: t.created_at
  }));

  // 3. Analytics Reales de Órdenes
  const activeTenantId = sucursales[0]?.id;
  const ordersResult = activeTenantId ? await getTenantOrders(activeTenantId) : { success: true, data: [] };
  const orders = ordersResult.success && ordersResult.data ? ordersResult.data : [];
  
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.total_amount), 0);
  
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

  // 4. Obtener el plan delegando a Server Action
  const subResult = activeTenantId ? await getTenantSubscription(activeTenantId) : { success: false };
  const planName = (subResult.success && subResult.data) ? subResult.data.plans?.name || "N/A" : "N/A";

  return (
    <section className="space-y-6 py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/onboarding" className="group flex flex-col justify-center rounded-3xl border bg-background p-6 shadow-sm hover:border-violet-500 transition-all">
          <span className="text-sm font-bold text-violet-600">Primeros pasos</span>
          <h2 className="text-xl font-black mt-1 group-hover:translate-x-1 transition-transform">Crear sucursal →</h2>
        </Link>
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Órdenes Activas</span>
          <p className="text-3xl font-black mt-1">{activeOrdersCount}</p>
        </div>
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Ventas Totales</span>
          <p className="text-3xl font-black mt-1">${totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Plan Actual</span>
          <p className="text-3xl font-black mt-1 text-violet-600 uppercase text-lg">{planName}</p>
        </div>
      </div>

      {platformRole === "admin" && (
        <div className="bg-violet-50 border border-violet-200 p-4 rounded-3xl">
          <p className="text-xs font-bold text-violet-800 uppercase tracking-tight">Acceso Administrador de Plataforma</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <SampleSalesChart />
        </div>
        <div className="lg:col-span-3">
          <ShopSummaryTable data={sucursales} />
        </div>
      </div>
    </section>
  );
}
