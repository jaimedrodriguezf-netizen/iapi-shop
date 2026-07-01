import { ensureUserTenant } from "@/lib/tenants/actions";
import { getProducts } from "@/lib/products/actions";
import { CotizadorClient } from "@/components/cotizador/cotizador-client";
import { redirect } from "next/navigation";
import { getUserRoleInfo } from "@/lib/auth/actions";

export const metadata = {
  title: "Cotizador Rápido - Tenddy Shop",
  description: "Crea y envía cotizaciones rápidas a tus clientes",
};

export default async function CotizadorPage() {
  const roleResult = await getUserRoleInfo();
  if (!roleResult.success || roleResult.data?.platformRole !== "admin") {
    redirect("/dashboard");
  }

  const result = await ensureUserTenant();
  if (!result.success || !result.data) {
    redirect("/onboarding");
  }

  const tenantId = result.data.id;
  const productsResult = await getProducts(tenantId);
  const products = productsResult.success && productsResult.products ? productsResult.products : [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cotizador Rápido</h2>
      </div>
      <CotizadorClient initialProducts={products} tenantName={result.data.name} />
    </div>
  );
}
