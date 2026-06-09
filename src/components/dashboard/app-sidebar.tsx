"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Settings,
  Store,
  User,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { logout } from "@/lib/auth/actions"
import pkg from "../../../package.json"
import { toast } from "sonner"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Mis Sucursales",
    url: "/dashboard/stores",
    icon: Store,
  },
  {
    title: "Productos",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Códigos QR",
    url: "/dashboard/qr",
    icon: QrCode,
  },
  {
    title: "Usuarios SaaS",
    url: "/dashboard/admin/users",
    icon: Users,
  },
]

const footerItems = [
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ email, planName, platformRole = "merchant" }: { email: string; planName: string; platformRole?: string }) {
  const { setOpenMobile, isMobile } = useSidebar()

  const handleNavItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <Image
            src="/logo.png"
            alt="IAPI Logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-black tracking-tight text-xl group-data-[collapsible=icon]:hidden">
            IAPI Shop
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {navItems
            .filter((item) => {
              if (item.url === "/dashboard/stores") {
                return planName.toLowerCase() === "business" || platformRole === "admin"
              }
              if (item.url === "/dashboard/admin/users") {
                return platformRole === "admin"
              }
              return true
            })
            .map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} onClick={handleNavItemClick} />}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-bold">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} onClick={handleNavItemClick} />}>
                <item.icon className="h-5 w-5" />
                <span className="font-bold">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="mt-4 flex items-center gap-3 px-4 py-2 group-data-[collapsible=icon]:px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-bold truncate max-w-[120px]">{email}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {platformRole === "admin" ? "Administrador" : "Vendedor"}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                    planName.toLowerCase() === "business" 
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/50" 
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {planName}
                  </span>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={async () => {
              const toastId = toast.loading("Cerrando sesión...");
              try {
                await logout();
              } finally {
                toast.dismiss(toastId);
              }
            }}>
              <SidebarMenuButton type="submit" className="w-full text-destructive hover:text-destructive" tooltip="Cerrar Sesión">
                <LogOut className="h-5 w-5" />
                <span className="font-bold">Cerrar Sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest text-center mt-4 group-data-[collapsible=icon]:hidden opacity-50 tabular-nums">
              v{pkg.version}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
