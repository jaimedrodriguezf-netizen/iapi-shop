import { ensureUserTenant } from "@/lib/tenants/actions";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const result = await ensureUserTenant();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-violet-600">Configuración</h1>
        <p className="text-muted-foreground italic">Personaliza la identidad visual y datos de tu sucursal.</p>
      </header>
      
      <SettingsForm tenant={result.data} />
    </section>
  );
}
