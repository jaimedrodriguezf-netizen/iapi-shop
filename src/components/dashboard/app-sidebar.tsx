"use client"

import * as React from "react"
import Link from "next/link"
import {
  CreditCard,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
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
    title: "Pedidos",
    url: "/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    title: "Productos",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Secciones",
    url: "/dashboard/sections",
    icon: LayoutGrid,
  },
  {
    title: "Códigos QR",
    url: "/dashboard/qr",
    icon: QrCode,
  },
  {
    title: "Favoritos",
    url: "/dashboard/analytics",
    icon: Heart,
  },
  {
    title: "Mis Sucursales",
    url: "/dashboard",
    icon: Store,
  },
  {
    title: "Usuarios SaaS",
    url: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Banners",
    url: "/dashboard/admin/banners",
    icon: Megaphone,
  },
  {
    title: "Secciones",
    url: "/dashboard/admin/sections",
    icon: LayoutGrid,
  },
  {
    title: "Suscripciones",
    url: "/dashboard/admin/subscriptions",
    icon: CreditCard,
  },
]

const footerItems = [
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({
  email,
  planName,
  platformRole = "merchant",
  activeTenantName,
  activeTenantColor,
}: {
  email: string;
  planName: string;
  platformRole?: string;
  activeTenantName?: string;
  activeTenantColor?: string;
}) {
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
          <span className="leading-none text-center shrink-0">
            <span className="block font-black text-lg text-orange-500">IAPI</span>
            <span className="block font-black text-[8px] text-orange-400 tracking-[0.2em] uppercase text-center -mt-1">shop</span>
          </span>
        </Link>
        {activeTenantName && (
          <div className="mt-2 flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeTenantColor || "#f97316" }}
            />
            <span className="text-xs font-medium text-muted-foreground truncate group-data-[collapsible=icon]:hidden">
              {activeTenantName}
            </span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {navItems
            .filter((item) => {
              if (item.title === "Mis Sucursales") {
                return planName.toLowerCase() === "plus" || platformRole === "admin"
              }
              if (item.url === "/dashboard/admin/users" || item.url === "/dashboard/admin/banners" || item.url === "/dashboard/admin/sections" || item.url === "/dashboard/admin/subscriptions") {
                return platformRole === "admin"
              }
              return true
            })
            .map((item) => (
<SidebarMenuItem key={item.url}>
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
