import { getMyTenant } from "@/lib/tenants/actions";
import { redirect } from "next/navigation";
import { generateQRCodeDataURL } from "@/lib/utils/qr";
import { QRViewClient } from "./qr-view-client";
import { headers } from "next/headers";

export default async function QRPage() {
  // 1. Obtener la sucursal delegando a la capa de lógica (Server Action)
  const result = await getMyTenant();

  if (!result.success || !result.tenant) {
    redirect("/onboarding");
  }

  const { tenant } = result;

  // 2. Construir la URL pública (usando el host actual)
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") || host?.includes("100.") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${tenant.slug}`;

  // 3. Generar el QR
  const qrDataUrl = await generateQRCodeDataURL(publicUrl);

  return (
    <section className="space-y-6 py-6 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-orange-600">Tu Código QR</h1>
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
