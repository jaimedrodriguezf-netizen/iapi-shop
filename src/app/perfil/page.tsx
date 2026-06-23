import { redirect } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { createClient } from "@/lib/supabase/server"
import { getMyTenants } from "@/lib/tenants/actions"
import { getUserRoleInfo, logoutAction } from "@/lib/auth/actions"
import { getFollowedTenants } from "@/lib/storefront/follow-actions"
import { Store, ShoppingBag, LogOut, Heart, Package, Tag, ExternalLink } from "lucide-react"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: tenants } = await getMyTenants()
  if (tenants && tenants.length > 0) redirect("/dashboard")

  const { data: roleInfo } = await getUserRoleInfo()
  const email = roleInfo?.email || user.email || "Usuario"

  // Fetch customer orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, tenant_id, total_amount, status, created_at, order_items(product_name, quantity, unit_price)")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch favorites (all, across tenants)
  const { data: allFavs } = await supabase
    .from("product_favorites")
    .select("product_id")
    .eq("user_id", user.id)
  const favoriteIds = (allFavs || []).map(f => f.product_id)

  // Fetch favorite product details
  let favoriteProducts: Array<{ id: string; name: string; price: number; image_url?: string }> = []
  if (favoriteIds.length > 0) {
    const { data: favProducts } = await supabase
      .from("products")
      .select("id, name, price, product_images(url)")
      .in("id", favoriteIds)
      .limit(20)
    favoriteProducts = (favProducts || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: (p.product_images as Array<{ url: string }>)?.[0]?.url,
    }))
  }

  // Fetch followed stores
  const followedResult = await getFollowedTenants()
  const followedStores = followedResult.success && followedResult.data ? followedResult.data : []

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" }
      case "confirmed": return { label: "Confirmado", color: "bg-blue-100 text-blue-700" }
      case "shipped": return { label: "Enviado", color: "bg-purple-100 text-purple-700" }
      case "delivered": return { label: "Entregado", color: "bg-green-100 text-green-700" }
      case "cancelled": return { label: "Cancelado", color: "bg-red-100 text-red-700" }
      default: return { label: s, color: "bg-zinc-100 text-zinc-700" }
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="leading-none text-center">
            <Logo className="text-xl" />
          </Link>
          <span className="text-sm font-medium text-zinc-500 truncate max-w-[180px]">{email}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        {/* Welcome */}
        <div className="text-center py-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
            <ShoppingBag className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Mi Perfil</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tus pedidos, favoritos y más.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 text-center">
            <Heart className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-black">{favoriteIds.length}</p>
            <p className="text-[11px] text-zinc-500 font-medium">Favoritos</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-4 text-center">
            <Package className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-black">{orders?.length || 0}</p>
            <p className="text-[11px] text-zinc-500 font-medium">Pedidos</p>
          </div>
        </div>

        {/* Followed Stores */}
        <section className="space-y-3">
          <h2 className="font-black text-lg">🏪 Tiendas que seguís</h2>
          {followedStores.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {followedStores.map(store => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border p-3 flex items-center gap-3 hover:border-orange-300 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                    <Store className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate group-hover:text-orange-500 transition-colors">{store.name}</p>
                    <p className="text-[10px] text-zinc-400">@{store.slug}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-zinc-300 shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-6 text-center">
              <Store className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 font-medium">No seguís ninguna tienda todavía</p>
              <Link href="/" className="inline-block mt-2 text-xs font-bold text-orange-500 hover:underline">
                Descubrir tiendas →
              </Link>
            </div>
          )}
        </section>

        {/* Recent Orders */}
        {orders && orders.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-black text-lg">📦 Mis Pedidos</h2>
            <div className="space-y-2">
              {orders.slice(0, 5).map(order => {
                const st = statusLabel(order.status)
                return (
                  <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-2xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {order.order_items?.map((i: { product_name: string }) => i.product_name).join(", ") || "Sin items"}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Favorites */}
        {favoriteProducts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-black text-lg">❤️ Mis Favoritos</h2>
            <div className="grid grid-cols-2 gap-2">
              {favoriteProducts.map(p => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl border p-3 flex items-center gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-zinc-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{p.name}</p>
                    <p className="text-xs text-orange-500 font-mono font-bold">${Number(p.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {(!orders || orders.length === 0) && favoriteProducts.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Package className="h-10 w-10 text-zinc-300 mx-auto" />
            <p className="text-zinc-400 font-medium text-sm">Todavía no tenés pedidos ni favoritos</p>
            <Link href="/" className="inline-block text-sm font-bold text-orange-500 hover:underline">
              Explorar tiendas →
            </Link>
          </div>
        )}

        {/* Vende con Nosotros */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-3xl border-2 border-orange-200 dark:border-orange-800 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-800 dark:text-zinc-100">¿Querés vender con nosotros?</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Elegí un plan y empezá a vender en minutos.
              </p>
            </div>
          </div>

          {/* Mini pricing cards */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/onboarding?plan=free" className="bg-white dark:bg-zinc-900 rounded-2xl border p-3 text-center hover:border-orange-400 transition-colors">
              <Tag className="h-4 w-4 text-zinc-400 mx-auto mb-1" />
              <p className="text-sm font-black">Free</p>
              <p className="text-[10px] text-zinc-500">$0 / año</p>
              <p className="text-[10px] text-zinc-400 mt-1">10 productos</p>
            </Link>
            <Link href="/onboarding?plan=plus" className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-orange-300 p-3 text-center hover:border-orange-500 transition-colors relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Popular</span>
              <Tag className="h-4 w-4 text-orange-400 mx-auto mb-1 mt-1" />
              <p className="text-sm font-black">Plus</p>
              <p className="text-[10px] text-zinc-500">$49.99 / año</p>
              <p className="text-[10px] text-zinc-400 mt-1">300 productos</p>
            </Link>
          </div>

          <Link
            href="/dashboard/planes"
            className="block text-center text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Ver todos los planes y beneficios →
          </Link>
        </section>

        {/* Logout */}
        <form action={logoutAction} className="text-center pt-4">
          <button type="submit" className="text-sm text-zinc-400 hover:text-red-500 font-medium transition-colors inline-flex items-center gap-1">
            <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}
