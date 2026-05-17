import { createClient } from "@/lib/supabase/server"
import { ProductListClient } from "@/components/dashboard/product-list-client"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
  const supabase = await createClient()

  // 1. Obtener la sucursal del usuario
  const { data: tenants } = await supabase.from("tenants").select("id").limit(1).single()

  if (!tenants) {
    redirect("/onboarding")
  }

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Catálogo de Productos</h1>
        <p className="text-muted-foreground italic">Gestiona los productos de tu sucursal.</p>
      </header>
      
      <ProductListClient tenantId={tenants.id} />
    </section>
  )
}
