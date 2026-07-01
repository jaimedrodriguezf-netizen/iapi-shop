import { ensureUserTenant, getTenantSubscription } from "@/lib/tenants/actions";
import { redirect } from "next/navigation";
import { generateQR } from "@/lib/utils/qr";
import { QRViewClient } from "./qr-view-client";
import { headers } from "next/headers";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function QRPage() {
  // 1. Obtener la sucursal delegando a la capa de lógica (Server Action)
  const result = await ensureUserTenant();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const tenant = result.data;
  
  // 2. Obtener la suscripción para verificar el plan
  const subResult = await getTenantSubscription(tenant.id);
  const planName = (subResult.success && subResult.data) ? subResult.data.plans?.name || "Free" : "Free";
  
  if (planName.toLowerCase() === "free") {
    return (
      <section className="space-y-6 py-6 px-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Código QR Premium</h1>
        <p className="text-muted-foreground text-lg max-w-md">
          El plan Free no incluye la opción de generar Código QR. Sube al plan <strong className="text-foreground">Starter</strong> para desbloquear esta función y permitir que tus clientes escaneen tu menú.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/planes">
            <Button size="lg" className="font-bold">
              Ver Planes Disponibles
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  // 3. Construir la URL pública (usando el host actual para environment-aware URL)
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") || host?.includes("100.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const publicUrl = `${baseUrl}/${tenant.slug}`;

  // 4. Generar el QR using the slug-based utility
  const qrDataUrl = await generateQR(tenant.slug, baseUrl);

  return (
    <section className="space-y-6 py-6 px-4 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-orange-500">Tu Código QR</h1>
        <p className="text-muted-foreground italic">Tus clientes pueden escanear esto para ver tu menú digital.</p>
      </header>
      
      <QRViewClient 
        qrDataUrl={qrDataUrl} 
        publicUrl={publicUrl} 
        tenantName={tenant.name} 
      />
    </section>
  );
}
