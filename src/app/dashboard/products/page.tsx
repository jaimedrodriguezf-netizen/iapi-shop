import { getMyTenant, getTenantSubscription } from "@/lib/tenants/actions"
import { ProductListClient } from "@/components/dashboard/product-list-client"
import { redirect } from "next/navigation"
import { getUserRoleInfo } from "@/lib/auth/actions"

export default async function ProductsPage() {
  const result = await getMyTenant()

  if (!result.success || !result.data) {
    redirect("/onboarding")
  }

  const roleResult = await getUserRoleInfo()
  const platformRole = roleResult.success && roleResult.data ? roleResult.data.platformRole : "merchant"

  const subResult = await getTenantSubscription(result.data.id)
  let planName = (subResult.success && subResult.data) ? subResult.data.plans?.name || "Free" : "Free"

  if (platformRole === "admin") {
    planName = "Business"
  }

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Catálogo de Productos</h1>
        <p className="text-muted-foreground italic">Gestiona los productos de tu sucursal.</p>
      </header>
      
      <ProductListClient tenantId={result.data.id} planName={planName} />
    </section>
  )
}
