import { getAllBanners } from "@/lib/admin/banner-actions"
import { getUserRoleInfo } from "@/lib/auth/actions"
import { BannerManager } from "@/components/dashboard/banner-manager"
import { redirect } from "next/navigation"

export default async function BannersPage() {
  const roleResult = await getUserRoleInfo()
  if (!roleResult.success || roleResult.data?.platformRole !== "admin") {
    redirect("/dashboard")
  }

  const result = await getAllBanners()
  const banners = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-black">Banners de Promoción</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestioná los banners del marketplace</p>
      </div>
      <BannerManager banners={banners} />
    </div>
  )
}