import { redirect } from "next/navigation"
import { getUserRoleInfo } from "@/lib/auth/actions"
import { getAllPlans } from "@/lib/admin/plan-actions"
import { getSaaSUsers } from "@/lib/admin/actions"
import { PlansManager } from "@/components/dashboard/plans-manager"

export default async function SubscriptionsPage() {
  const roleInfo = await getUserRoleInfo()
  if (!roleInfo.success || roleInfo.data?.platformRole !== "admin") redirect("/dashboard")

  const plansResult = await getAllPlans()
  const plans = plansResult.success && plansResult.data ? plansResult.data : []

  const usersResult = await getSaaSUsers()
  const users = usersResult.success && usersResult.data ? usersResult.data : []

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Gestión de Suscripciones</h1>
        <p className="text-muted-foreground italic">
          Creá y administrá los planes de suscripción, precios y funcionalidades
        </p>
      </header>
      <PlansManager plans={plans} users={users} />
    </section>
  )
}