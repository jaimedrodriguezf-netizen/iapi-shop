import { getStorefrontData } from "@/lib/storefront/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle, MapPin, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";
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

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "instagram":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 8H7v3h2v9h3v-9h3.6L16 8h-3V6.7C13 5.8 13.3 5 14.5 5H16V2h-2.5C10.5 2 9 3.5 9 6.7V8z"/>
        </svg>
      );
    case "tiktok":
      return (
        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.86.95 2 1.63 3.25 1.95v3.91c-1.34-.14-2.61-.69-3.62-1.57-.65-.54-1.16-1.24-1.5-2.02v6.62c.03 2.07-.63 4.14-1.92 5.76-1.54 2-3.96 3.12-6.49 3.09-2.92.07-5.74-1.63-7.01-4.27-1.46-2.85-.98-6.47 1.17-8.8 1.83-2.05 4.7-2.88 7.33-2.12v4.02c-1.28-.46-2.73-.25-3.81.56-.99.71-1.53 1.93-1.4 3.15.11 1.48 1.22 2.76 2.7 2.99 1.52.27 3.09-.59 3.63-2.01.21-.51.29-1.07.28-1.62V.02z"/>
        </svg>
      );
    default:
      return <Share2 className="h-5 w-5" />;
  }
};

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
      <header className="bg-white dark:bg-zinc-900 border-b pb-8">
        <div className="h-32 w-full" style={{ backgroundColor: brandColor }} />
        <div className="max-w-4xl mx-auto px-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-xl border-4 border-white dark:border-zinc-900 bg-zinc-100 overflow-hidden shadow-xl relative text-[var(--brand-color)]">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} fill sizes="96px" priority={true} className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black bg-muted/20">
                  {tenant.name[0]}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-black tracking-tight text-balance">{tenant.name}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground font-medium">
                {tenant.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {tenant.city}</span>
                )}
                {tenant.whatsapp_phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {tenant.whatsapp_phone}</span>
                )}
              </div>
            </div>
            <Button 
              render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />} 
              style={{ backgroundColor: brandColor }}
              className="rounded-xl hover:opacity-90 text-white font-bold px-6 shadow-lg dark:shadow-none"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Chatear
            </Button>
          </div>
        </div>
      </header>

      {/* Catalog with category filtering */}
      <StorefrontCatalog
        categories={categories}
        products={products}
        tenantId={tenant.id}
        brandColor={brandColor}
        whatsappPhone={tenant.whatsapp_phone}
      />

      {/* Info de contacto y Redes (Footer) */}
      <footer className="bg-white dark:bg-zinc-900 border-t py-12 mt-12 px-6">
        {(formattedAddress || (tenant.social_links && (tenant.social_links.instagram || tenant.social_links.facebook || tenant.social_links.tiktok))) && (
          <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-2 text-center sm:text-left mb-8">
            {formattedAddress && (
              <div className="space-y-4">
                <h4 className="font-black text-lg">Visítanos</h4>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                  {formattedAddress}
                </p>
              </div>
            )}
            {tenant.social_links && (tenant.social_links.instagram || tenant.social_links.facebook || tenant.social_links.tiktok) && (
              <div className="space-y-4">
                <h4 className="font-black text-lg">Síguenos</h4>
                <div className="flex justify-center sm:justify-start gap-4">
                  {tenant.social_links.instagram && (
                    <a href={tenant.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-color)] transition-colors">
                      <SocialIcon platform="instagram" />
                    </a>
                  )}
                  {tenant.social_links.facebook && (
                    <a href={tenant.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-color)] transition-colors">
                      <SocialIcon platform="facebook" />
                    </a>
                  )}
                  {tenant.social_links.tiktok && (
                    <a href={tenant.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-color)] transition-colors">
                      <SocialIcon platform="tiktok" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
          Potenciado por IAPI Shop
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