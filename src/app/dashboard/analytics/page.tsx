import { getTenantFavoriteStats } from "@/lib/storefront/favorites-actions"
import { getMyTenants } from "@/lib/tenants/actions"
import { getProducts } from "@/lib/products/actions"
import { FavoritesAnalytics } from "@/components/dashboard/favorites-analytics"

export default async function AnalyticsPage() {
  const tenantsResult = await getMyTenants()
  const tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : []
  const activeTenant = tenants[0]
  const activeTenantId = activeTenant?.id
  const activeTenantName = activeTenant?.name || "Mi Tienda"

  if (!activeTenantId) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground font-bold">No tenes sucursales todavia.</p>
      </div>
    )
  }

  const statsResult = await getTenantFavoriteStats(activeTenantId)
  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    totalFavorites: 0,
    thisWeekFavorites: 0,
    mostFavorited: [],
    favoritesByDay: [],
  }

  const productsResult = await getProducts(activeTenantId)
  const productCount = productsResult.success ? (productsResult.products?.length || 0) : 0

  return (
    <div className="space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Analytics de Favoritos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mira que productos le gustan mas a tus clientes — {activeTenantName}
        </p>
      </div>
      <FavoritesAnalytics 
        stats={stats} 
        productCount={productCount} 
      />
    </div>
  )
}