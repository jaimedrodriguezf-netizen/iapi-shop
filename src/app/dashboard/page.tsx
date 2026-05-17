import Link from "next/link";
import { getBootstrapPlatformRole } from "@/lib/auth/platform-admins";
import { createClient } from "@/lib/supabase/server";
import { SampleSalesChart } from "@/components/dashboard/sample-chart";
import { ShopSummaryTable, ShopSummary } from "@/components/dashboard/shop-summary-table";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  // 1. Obtener datos del usuario
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = typeof claimsData?.claims?.email === "string" ? claimsData.claims.email : "Usuario registrado";
  const platformRole = getBootstrapPlatformRole(email);

  // 2. Fetch real de sucursales (tenants)
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  const sucursales: ShopSummary[] = (tenants || []).map(t => ({
    id: t.id,
    name: t.name,
    status: t.status === "active" ? "Activa" : t.status,
    created_at: t.created_at
  }));

  // 3. Obtener el plan (simplificado por ahora desde la primera sucursal o default)
  const { data: subscription } = sucursales.length > 0 
    ? await supabase.from("tenant_subscriptions").select("plans(name)").eq("tenant_id", sucursales[0].id).single()
    : { data: null };
  
  const planName = (subscription as any)?.plans?.name || "N/A";

  return (
    <section className="space-y-6 py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/onboarding" className="group flex flex-col justify-center rounded-3xl border bg-background p-6 shadow-sm hover:border-orange-500 transition-all">
          <span className="text-sm font-bold text-orange-600">Primeros pasos</span>
          <h2 className="text-xl font-black mt-1 group-hover:translate-x-1 transition-transform">Crear sucursal →</h2>
        </Link>
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Sucursales Activas</span>
          <p className="text-3xl font-black mt-1">{sucursales.filter(s => s.status === "Activa").length}</p>
        </div>
        <div className="rounded-3xl border bg-background p-6 shadow-sm opacity-50">
          <span className="text-sm font-bold text-muted-foreground">Ventas Totales</span>
          <p className="text-3xl font-black mt-1">$0.00</p>
        </div>
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Plan Actual</span>
          <p className="text-3xl font-black mt-1 text-orange-600 uppercase text-lg">{planName}</p>
        </div>
      </div>

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
