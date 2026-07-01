import { getMyTenants } from "@/lib/tenants/actions"
import { getAllSections } from "@/lib/sections/actions"
import { SectionsManager } from "@/components/dashboard/sections-manager"
import { getUserRoleInfo } from "@/lib/auth/actions"
import { redirect } from "next/navigation"

export default async function SectionsPage() {
  const roleResult = await getUserRoleInfo()
  if (!roleResult.success || roleResult.data?.platformRole !== "admin") {
    redirect("/dashboard")
  }

  // Get the tenant for this seller
  const tenantsResult = await getMyTenants()
  const tenant = tenantsResult.success && tenantsResult.data ? tenantsResult.data[0] : null
  
  if (!tenant) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground font-bold">Creá una tienda primero para gestionar secciones</p>
      </div>
    )
  }

  const result = await getAllSections(tenant.id)
  const sections = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-black">Secciones de tu Tienda</h1>
        <p className="text-muted-foreground text-sm mt-1">Organizá tus productos en secciones temáticas para tu escaparate</p>
      </div>
      <SectionsManager sections={sections} tenantId={tenant.id} />
    </div>
  )
}