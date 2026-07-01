import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { getMyTenants, getTenantSubscription } from "@/lib/tenants/actions"
import { getUserRoleInfo } from "@/lib/auth/actions"
import { ReConsentBanner } from "@/components/legal/re-consent-banner"
import { User } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Logo } from "@/components/logo"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const roleResult = await getUserRoleInfo()
  const platformRole = roleResult.success && roleResult.data ? roleResult.data.platformRole : "merchant"
  const email = roleResult.success && roleResult.data ? roleResult.data.email : "Usuario"

  const tenantsResult = await getMyTenants()
  const tenants = tenantsResult.success && tenantsResult.data ? tenantsResult.data : []

  // If user has no tenants, redirect to profile
  if (tenants.length === 0 && platformRole !== "admin") {
    redirect("/perfil")
  }

  let planName = "Free"
  if (tenants.length > 0) {
    const activeTenantId = tenants[0].id
    const subResult = await getTenantSubscription(activeTenantId)
    if (subResult.success && subResult.data) {
      planName = subResult.data.plans?.name || "Free"
    }
  }

  if (platformRole === "admin") {
    planName = "Plus"
  }

  const activeTenant = tenants[0]
  const activeTenantName = activeTenant?.name
  const activeTenantColor = activeTenant?.brand_color || undefined

  return (
    <SidebarProvider>
      <AppSidebar
        email={email}
        planName={planName}
        platformRole={platformRole}
        activeTenantName={activeTenantName}
        activeTenantColor={activeTenantColor}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-8 md:w-8" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    <Logo className="text-sm" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3 px-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-foreground">
                  {activeTenantName || "Mi Tienda"}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                  Plan {planName}
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border shadow-sm">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ReConsentBanner isAdmin={platformRole === "admin"} />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
