import { ensureUserTenant } from "@/lib/tenants/actions";
import { redirect } from "next/navigation";
import { generateQR } from "@/lib/utils/qr";
import { QRViewClient } from "./qr-view-client";
import { headers } from "next/headers";

export default async function QRPage() {
  // 1. Obtener la sucursal delegando a la capa de lógica (Server Action)
  const result = await ensureUserTenant();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const tenant = result.data;

  // 2. Construir la URL pública (usando el host actual para environment-aware URL)
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") || host?.includes("100.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const publicUrl = `${baseUrl}/${tenant.slug}`;

  // 3. Generar el QR using the slug-based utility
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
