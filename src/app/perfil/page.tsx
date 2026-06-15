import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getMyTenants } from "@/lib/tenants/actions"
import { getUserRoleInfo, logoutAction } from "@/lib/auth/actions"
import { Store, ShoppingBag, LogOut, User } from "lucide-react"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: tenants } = await getMyTenants()
  if (tenants && tenants.length > 0) redirect("/dashboard")

  const { data: roleInfo } = await getUserRoleInfo()
  const email = roleInfo?.email || user.email || "Usuario"

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="leading-none text-center">
            <span className="block font-black text-xl text-orange-500">IAPI</span>
            <span className="block font-black text-[8px] text-orange-400 tracking-[0.2em] uppercase text-center -mt-1">shop</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <User className="h-4 w-4" />
            <span className="font-medium truncate max-w-[200px]">{email}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          {/* Welcome */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">¡Bienvenido!</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Explorá tiendas locales o creá la tuya propia.
            </p>
          </div>

          {/* Seller CTA Card */}
          <Link
            href="/onboarding"
            className="block bg-white dark:bg-zinc-900 rounded-3xl border-2 border-orange-200 dark:border-orange-800 p-6 shadow-sm hover:shadow-md hover:border-orange-400 dark:hover:border-orange-600 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Store className="h-6 w-6 text-orange-500" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                  🚀 ¿Querés vender?
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Creá tu tienda gratis y empezá a vender por WhatsApp en minutos. 
                  Catálogo digital, QR, pedidos y más.
                </p>
                <span className="inline-block mt-2 text-sm font-bold text-orange-500 group-hover:translate-x-1 transition-transform">
                  Crear mi Tienda →
                </span>
              </div>
            </div>
          </Link>

          {/* Explore Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                  🛒 Seguí comprando
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Explorá tiendas cerca tuyo y pedí por WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <form action={logoutAction} className="text-center">
            <button type="submit" className="text-sm text-zinc-400 hover:text-red-500 font-medium transition-colors inline-flex items-center gap-1">
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}