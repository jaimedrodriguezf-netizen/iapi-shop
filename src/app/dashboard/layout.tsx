import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { getMyTenants, getTenantSubscription } from "@/lib/tenants/actions"
import { getUserRoleInfo } from "@/lib/auth/actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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
  
  let planName = "Free"
  if (tenants.length > 0) {
    const activeTenantId = tenants[0].id
    const subResult = await getTenantSubscription(activeTenantId)
    if (subResult.success && subResult.data) {
      planName = subResult.data.plans?.name || "Free"
    }
  }

  if (platformRole === "admin") {
    planName = "Business"
  }

  return (
    <SidebarProvider>
      <AppSidebar email={email} planName={planName} platformRole={platformRole} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-10 w-10 md:h-8 md:w-8" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    IAPI Shop
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
            <span className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
              planName.toLowerCase() === "business" 
                ? "bg-violet-accent/10 text-violet-accent border border-violet-accent/20" 
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-transparent"
            }`}>
              Plan {planName}
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
