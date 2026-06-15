"use client"

import * as React from "react"
import Link from "next/link"
import { User, ShoppingBag, Store, LayoutDashboard, PlusCircle, Bell, LogOut, ChevronRight, Camera } from "lucide-react"
import { logoutToLanding } from "@/lib/auth/actions"
import { toast } from "sonner"
import { uploadAvatar } from "@/lib/auth/avatar-actions"

async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
      const canvas = document.createElement("canvas")
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }))
      }, "image/webp", quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

interface ProfilePopoverProps {
  email: string
  hasTenant: boolean
  canCreateStore: boolean  // true if 0 tenants or has plus plan
  tenantSlug?: string
  unreadNotifications?: number
  avatarUrl?: string | null
  className?: string
}

export function ProfilePopover({ email, hasTenant, canCreateStore, tenantSlug, unreadNotifications = 0, avatarUrl, className }: ProfilePopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [avatarUrlState, setAvatarUrlState] = React.useState(avatarUrl)
  const displayAvatar = avatarUrlState ?? avatarUrl

  return (
    <div className={`relative ${className || ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="p-0.5 rounded-full hover:ring-2 hover:ring-orange-400 transition-all"
        aria-label="Perfil"
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt="" className="h-8 w-8 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
        ) : (
          <div className="p-1.5 rounded-full">
            <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:w-72 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-2xl shadow-xl z-50 overflow-hidden max-w-sm mx-auto sm:mx-0">
            {/* User info */}
            <div className="p-4 border-b dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <User className="h-7 w-7 text-orange-500" />
                    </div>
                  )}
                  {/* Camera overlay */}
                  <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return }

                        // Client-side compression
                        const compressed = await compressImage(file, 256, 0.8)

                        const result = await uploadAvatar(compressed)
                        if (result.success && result.data) {
                          setAvatarUrlState(result.data.url)
                          toast.success("Foto actualizada")
                        } else {
                          toast.error(result.error || "Error")
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{email}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {hasTenant ? "Cliente · Vendedor" : "Cliente"}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {/* Always: Continue Shopping */}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ShoppingBag className="h-4 w-4 text-zinc-500" />
                <span className="flex-1">Seguir Comprando</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>

              {/* If has tenant: My Store + Dashboard */}
              {hasTenant && tenantSlug && (
                <>
                  <div className="border-t dark:border-zinc-800 my-1" />
                  <Link
                    href={`/${tenantSlug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Store className="h-4 w-4 text-zinc-500" />
                    <span className="flex-1">Mi Tienda</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                    <span className="flex-1">Dashboard</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                </>
              )}

              {/* If can create store: Create Store CTA */}
              {canCreateStore && (
                <>
                  <div className="border-t dark:border-zinc-800 my-1" />
                  <Link
                    href="/onboarding"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="flex-1">Crear Tienda</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}

              {/* Notifications */}
              <div className="border-t dark:border-zinc-800 my-1" />
              <Link
                href="/perfil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Bell className="h-4 w-4 text-zinc-500" />
                <span className="flex-1">Notificaciones</span>
                {unreadNotifications > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadNotifications}</span>
                )}
              </Link>

              {/* Logout */}
              <div className="border-t dark:border-zinc-800 my-1" />
              <button
                onClick={async () => {
                  setOpen(false)
                  await logoutToLanding()
                  window.location.href = "/login"
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="flex-1">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}