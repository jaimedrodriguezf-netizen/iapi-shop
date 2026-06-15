import { redirect } from "next/navigation"
import { getUserRoleInfo } from "@/lib/auth/actions"
import { getAllSections } from "@/lib/sections/actions"
import { SectionsManager } from "@/components/dashboard/sections-manager"

export default async function AdminSectionsPage() {
  const roleInfo = await getUserRoleInfo()
  if (!roleInfo.success || roleInfo.data?.platformRole !== "admin") redirect("/dashboard")

  const result = await getAllSections(null)
  const sections = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-black">Secciones del Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">Creá secciones temáticas para organizar productos en la landing</p>
      </div>
      <SectionsManager sections={sections} tenantId={null} isAdmin />
    </div>
  )
}