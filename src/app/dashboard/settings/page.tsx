import { ensureUserTenant, getTenantSubscription, getColorPalettes, getCountries } from "@/lib/tenants/actions";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { getStorefrontData } from "@/lib/storefront/actions";

export default async function SettingsPage() {
  const result = await ensureUserTenant();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  // Fetch storefront details, subscription plan, and geographic countries in parallel
  const [storefrontResult, subResult, palettesResult, countriesResult] = await Promise.all([
    getStorefrontData(result.data.slug),
    getTenantSubscription(result.data.id),
    getColorPalettes(),
    getCountries(),
  ]);

  const initialProducts = storefrontResult.products || [];
  const planName = (subResult.success && subResult.data) ? subResult.data.plans?.name || "Free" : "Free";
  const palettes = (palettesResult.success && palettesResult.data) ? palettesResult.data : [];
  const countries = (countriesResult.success && countriesResult.data) ? countriesResult.data : [];

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-orange-500">Configuración</h1>
        <p className="text-muted-foreground italic">Personaliza la identidad visual y datos de tu sucursal.</p>
      </header>
      
      <SettingsForm 
        tenant={result.data} 
        initialProducts={initialProducts}
        planName={planName}
        palettes={palettes}
        countries={countries}
      />
    </section>
  );
}
