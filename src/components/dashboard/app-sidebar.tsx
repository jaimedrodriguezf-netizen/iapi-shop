"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  LogOut,
  Package,
  QrCode,
  Settings,
  Store,
  User,
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
]

const footerItems = [
  {
    title: "Configuración",
    url: "/dashboard/settings",
    icon: Settings,
  },
]

export function AppSidebar({ email }: { email: string }) {
  const { setOpenMobile, isMobile } = useSidebar()

  const handleNavItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white">
            <Store className="h-5 w-5" />
          </div>
          <span className="font-black tracking-tight text-xl group-data-[collapsible=icon]:hidden">
            IAPI Shop
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4">
          {navItems.map((item) => (
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
                <span className="text-[10px] text-muted-foreground uppercase">Vendedor</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton type="submit" className="w-full text-destructive hover:text-destructive" tooltip="Cerrar Sesión">
                <LogOut className="h-5 w-5" />
                <span className="font-bold">Cerrar Sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
