import { getStorefrontData } from "@/lib/storefront/actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import type { Address } from "@/lib/tenants/actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  
  if (!data.success || !data.tenant) {
    return { title: "Sucursal no encontrada" };
  }

  const description = `Mira los productos de ${data.tenant.name} y haz tu pedido por WhatsApp.`;

  return {
    title: `${data.tenant.name} | Catálogo Digital`,
    description: data.tenant.brand_color ? description : `Catálogo de productos de ${data.tenant.name}`,
    openGraph: {
      title: `${data.tenant.name} | Catálogo Digital`,
      description,
      type: "website",
    },
  };
}



export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);

  if (!data.success || !data.tenant) {
    notFound();
  }

  const { tenant, categories = [], products = [] } = data;

  if (tenant.status === "draft") {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.79 1.79 0 1114.7 18.5l-5.83-5.83m.92-2.11L18.08 4.66a1.39 1.39 0 00-1.39-1.39H12.9a1.39 1.39 0 00-1 .4l-5.63 5.63a1.39 1.39 0 00-.4 1v3.79c0 .37.15.72.4 1L12.9 20.7a1.39 1.39 0 001.96 0l2.5-2.5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">{tenant.name}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Tienda en construcción: Esta tienda está en modo borrador y no es pública aún.
            </p>
          </div>
          <div className="pt-2">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-black tracking-widest">
              Potenciado por IAPI Shop
            </div>
          </div>
        </div>
      </main>
    );
  }

  const whatsappUrl = tenant.whatsapp_phone 
    ? `https://wa.me/${tenant.whatsapp_phone.replace(/\+/g, "")}?text=${encodeURIComponent("Hola! Vengo de tu catálogo digital y me gustaría hacer una consulta.")}`
    : "#";

  const brandColor = tenant.brand_color || "#7c3aed";

  // Format structured address for display
  const formatAddress = (addr: Address | string | null | undefined): string | null => {
    if (!addr) return null;
    if (typeof addr === "string") {
      const trimmed = addr.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed) as Address;
          const parts = [parsed.street, parsed.city, parsed.state, parsed.zip, parsed.country].filter(Boolean);
          return parts.length > 0 ? parts.join(", ") : null;
        } catch (e) {
          // Fall back to treating it as a raw string if parsing fails
        }
      }
      return trimmed || null;
    }
    const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formattedAddress = formatAddress(tenant.address as Address | string | null | undefined);

  return (
    <main 
      className="min-h-screen bg-zinc-50 dark:bg-black pb-24"
      style={{ "--brand-color": brandColor } as React.CSSProperties}
    >
      {/* Header / Hero */}
      <StorefrontHeader 
        tenant={tenant}
        formattedAddress={formattedAddress}
        whatsappUrl={whatsappUrl}
      />

      {/* Catalog with category filtering */}
      <StorefrontCatalog
        categories={categories}
        products={products}
        tenantId={tenant.id}
        brandColor={brandColor}
        whatsappPhone={tenant.whatsapp_phone}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t py-8 mt-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </p>
          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
            Potenciado por IAPI Shop
          </div>
        </div>
      </footer>

      {/* Floating Cart Drawer */}
      <CartDrawer whatsapp={tenant.whatsapp_phone} tenantName={tenant.name} tenantId={tenant.id} />
    </main>
  );
}

// Re-export Product type for the StorefrontCatalog component
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
  category_id?: string;
}