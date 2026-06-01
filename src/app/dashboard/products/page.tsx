import { getMyTenant } from "@/lib/tenants/actions"
import { ProductListClient } from "@/components/dashboard/product-list-client"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
  const result = await getMyTenant()

  if (!result.success || !result.data) {
    redirect("/onboarding")
  }

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Catálogo de Productos</h1>
        <p className="text-muted-foreground italic">Gestiona los productos de tu sucursal.</p>
      </header>
      
      <ProductListClient tenantId={result.data.id} />
    </section>
  )
}
