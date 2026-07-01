import Link from "next/link";
import { Shield, Users, Megaphone, LayoutGrid, CreditCard, ClipboardCheck, Store } from "lucide-react";
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

  // 3. Analytics Reales de Órdenes (solo para merchants con tenant activo)
  const activeTenantId = sucursales[0]?.id;
  const ordersResult = activeTenantId && platformRole !== "admin"
    ? await getTenantOrders(activeTenantId) 
    : { success: true, data: [] };
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
  let productLimit = 15;
  const activeTenant = tenants[0];
  if (activeTenantId) {
    const limitCheck = await checkProductLimit(activeTenantId);
    productCount = limitCheck.current;
    if (limitCheck.limit > 0) {
      productLimit = limitCheck.limit;
    }
  }

  return (
    <section className="space-y-6 py-6">
      {platformRole === "admin" ? (
        /* ── ADMIN DASHBOARD ── */
        <>
          <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Panel de Administración</h1>
            </div>
            <p className="text-orange-100 text-sm max-w-xl">
              Gestioná usuarios, productos, banners, suscripciones y revisá el marketplace desde acá.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/admin/users" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Usuarios SaaS</h3>
                <p className="text-sm text-muted-foreground mt-1">Gestionar usuarios, roles y permisos de plataforma</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/banners" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 shrink-0">
                <Megaphone className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Banners</h3>
                <p className="text-sm text-muted-foreground mt-1">Gestionar banners promocionales del marketplace</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/sections" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 shrink-0">
                <LayoutGrid className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Secciones</h3>
                <p className="text-sm text-muted-foreground mt-1">Organizar productos en secciones del marketplace</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/subscriptions" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 shrink-0">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Suscripciones</h3>
                <p className="text-sm text-muted-foreground mt-1">Gestionar planes y suscripciones de tenants</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/review" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/30 shrink-0">
                <ClipboardCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Revisión</h3>
                <p className="text-sm text-muted-foreground mt-1">Revisar productos pendientes de publicación</p>
              </div>
            </Link>

            <Link href="/" className="group rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 hover:shadow-md transition-all flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 shrink-0">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-black text-lg group-hover:text-orange-500 transition-colors">Ver Marketplace</h3>
                <p className="text-sm text-muted-foreground mt-1">Ver la tienda general como la ven los clientes</p>
              </div>
            </Link>
          </div>

          {sucursales.length > 0 && (
            <>
              <h2 className="text-xl font-black mt-8">Sucursales en la plataforma</h2>
              <ShopSummaryTable data={sucursales} />
            </>
          )}
        </>
      ) : (
        /* ── MERCHANT DASHBOARD ── */
        <>
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
        <span>Un producto de <a href="https://januscore.pro" target="_blank" rel="noopener noreferrer" className="hover:underline text-orange-500 font-medium">Janus Core</a> © {new Date().getFullYear()}</span>
      </div>
        </>
      )}
    </section>
  );
}
