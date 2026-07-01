import { ensureUserTenant } from "@/lib/tenants/actions";
import { ReciberaClient } from "@/components/recibos/recibera-client";
import { redirect } from "next/navigation";
import { getUserRoleInfo } from "@/lib/auth/actions";

export const metadata = {
  title: "Recibera Digital - Tenddy Shop",
  description: "Crea y envía recibos digitales a tus clientes",
};

export default async function RecibosPage() {
  const roleResult = await getUserRoleInfo();
  if (!roleResult.success || roleResult.data?.platformRole !== "admin") {
    redirect("/dashboard");
  }

  const result = await ensureUserTenant();
  if (!result.success || !result.data) {
    redirect("/onboarding");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Recibera Digital</h2>
      </div>
      <ReciberaClient tenantName={result.data.name} />
    </div>
  );
}
