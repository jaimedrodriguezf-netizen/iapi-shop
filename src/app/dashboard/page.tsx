import Link from "next/link";
import { SampleSalesChart } from "@/components/dashboard/sample-chart";
import { ShopSummaryTable, ShopSummary } from "@/components/dashboard/shop-summary-table";
import { getTenantOrders } from "@/lib/orders/actions";
import { getMyTenants, getTenantSubscription, ensureUserTenant, type Tenant } from "@/lib/tenants/actions";
import { getUserRoleInfo } from "@/lib/auth/actions";
import { OnboardingChecklistWidget, PremiumBenefitsWidget, UsageLimitsWidget } from "@/components/dashboard/free-plan-widgets";
import { checkProductLimit } from "@/lib/products/actions";

export default async function DashboardPage() {
  // 1. Obtener datos del usuario delegando a Server Action (GGA Compliance)
  const roleResult = await getUserRoleInfo();
  const platformRole = roleResult.success && roleResult.data ? roleResult.data.platformRole : "merchant";

  // 2. Fetch de sucursales delegando a Server Action (GGA Clean Architecture)
  let tenants: Tenant[] = [];
  if (platformRole !== "admin") {
    const ensureResult = await ensureUserTenant();
    if (ensureResult.success && ensureResult.data) {
      tenants = [ensureResult.data];
    }
  } else {
    const tenantsResult = await getMyTenants();
    tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : [];
  }

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

  // Formatear datos para el gráfico mensual de los últimos 6 meses
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const now = new Date();
  interface ChartDataPoint {
    year: number;
    monthIndex: number;
    monthKey: string;
    monthName: string;
    sales: number;
  }
  const last6MonthsData: ChartDataPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6MonthsData.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      monthName: months[d.getMonth()],
      sales: 0,
    });
  }

  orders.forEach(order => {
    if (order.status === 'cancelled') return;
    const orderDate = new Date(order.created_at);
    const orderMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    const foundMonth = last6MonthsData.find(m => m.monthKey === orderMonthKey);
    if (foundMonth) {
      foundMonth.sales += Number(order.total_amount);
    }
  });

  const chartData = last6MonthsData.map(m => ({
    month: m.monthName,
    sales: Number(m.sales.toFixed(2)),
  }));

  // 4. Obtener el plan delegando a Server Action
  const subResult = activeTenantId ? await getTenantSubscription(activeTenantId) : { success: false };
  let planName = (subResult.success && subResult.data) ? subResult.data.plans?.name || "N/A" : "N/A";

  if (platformRole === "admin") {
    planName = "Plus";
  }

  const isFreePlan = planName.toLowerCase() === "free";

  // Fetch shopCount via getMyTenants()
  const myTenantsResult = await getMyTenants();
  const shopCount = myTenantsResult.success && myTenantsResult.data ? myTenantsResult.data.length : 0;

  // Fetch productCount and productLimit via checkProductLimit(activeTenantId)
  let productCount = 0;
  let productLimit = 10;
  const activeTenant = tenants[0];
  if (activeTenantId) {
    const limitCheck = await checkProductLimit(activeTenantId);
    productCount = limitCheck.current;
    productLimit = limitCheck.limit;
  }

  return (
    <section className="space-y-6 py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/onboarding" className="group flex flex-col justify-center rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 transition-all">
          <span className="text-sm font-bold text-orange-500">Primeros pasos</span>
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
          <p className="text-orange-500 uppercase text-lg">{planName}</p>
        </div>
      </div>

      {platformRole === "admin" && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-3xl">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-tight">Acceso Administrador de Plataforma</p>
        </div>
      )}

      {isFreePlan ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <OnboardingChecklistWidget
              storeName={activeTenant?.name}
              storeSlug={activeTenant?.slug}
              whatsappPhone={activeTenant?.whatsapp_phone}
              productCount={productCount}
            />
            <PremiumBenefitsWidget />
          </div>
          <div>
            <UsageLimitsWidget
              currentProducts={productCount}
              productLimit={productLimit}
              currentShops={shopCount}
              shopLimit={1}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SampleSalesChart data={chartData} />
          </div>
          <div className="lg:col-span-3">
            <ShopSummaryTable data={sucursales} />
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
        <span>IAPI Shop © {new Date().getFullYear()}</span>
      </div>
    </section>
  );
}
