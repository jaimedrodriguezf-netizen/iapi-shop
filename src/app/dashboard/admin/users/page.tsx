import { getSaaSUsers } from "@/lib/admin/actions";
import { getUserRoleInfo } from "@/lib/auth/actions";
import { AdminUsersClient } from "@/components/dashboard/admin-users-client";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  // 1. Validar a nivel de servidor que el rol sea administrador de plataforma
  const roleResult = await getUserRoleInfo();
  if (!roleResult.success || roleResult.data?.platformRole !== "admin") {
    redirect("/dashboard");
  }

  // 2. Cargar todos los usuarios del SaaS delegando en la Server Action
  const usersResult = await getSaaSUsers();
  const users = usersResult.success && usersResult.data ? usersResult.data : [];

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Control de Usuarios SaaS</h1>
        <p className="text-muted-foreground italic">
          Audita el rol global de los comerciantes, sus tiendas, planes de suscripción activos y volumen de productos.
        </p>
      </header>

      <AdminUsersClient initialUsers={users} />
    </section>
  );
}
