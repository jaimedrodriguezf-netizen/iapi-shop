import { getStorefrontData } from "@/lib/storefront/actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontFavoritesWrapper } from "@/components/storefront/storefront-favorites-wrapper";
import { getMyFavoriteIds } from "@/lib/storefront/favorites-actions";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/lib/tenants/actions";
import { getTenantSections } from "@/lib/sections/actions";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import { LEGAL_LINKS_ENABLED } from "@/lib/legal/constants";
import { StoreReportButton } from "@/components/legal/store-report-button";

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

  // Fetch tenant sections for dynamic tabs
  const sectionsResult = await getTenantSections(tenant.id)
  const tenantSections = sectionsResult.success && sectionsResult.data ? sectionsResult.data : []

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
              Potenciado por Tenddy Shop
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isFreePlan = tenant.plan_name ? tenant.plan_name.toLowerCase().includes("free") : false;
  const brandColor = tenant.brand_color || "#f97316";
  const secondaryColor = tenant.secondary_color || "#bae6fd";
  const displayedProducts = isFreePlan ? products.slice(0, 15) : products;

  // Fetch favorites for authenticated users
  const supabaseForFavs = await createClient();
  const { data: { user } } = await supabaseForFavs.auth.getUser();
  let favoriteIds: string[] = [];
  let userFavorites: Array<{ id: string; name: string; price: number; image_url?: string }> = [];
  if (user) {
    const favResult = await getMyFavoriteIds(tenant.id);
    if (favResult.success) {
      favoriteIds = favResult.data || [];
    }
    // Get favorite product details
    if (favoriteIds.length > 0) {
      const favProducts = displayedProducts.filter((p: { id: string }) => favoriteIds.includes(p.id));
      userFavorites = favProducts.map((p: { id: string; name: string; price: number; image_urls?: string[] }) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_urls?.[0],
      }));
    }
  }

  // Format structured address for display
  const formatAddress = (addr: Address | string | null | undefined): string | null => {
    if (!addr) return null;
    if (typeof addr === "string") {
      const trimmed = addr.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed) as Address;
          const parts = [parsed.street, parsed.city, parsed.state, parsed.country].map(p => p?.trim()).filter(Boolean);
          return parts.length > 0 ? parts.join(", ") : null;
} catch {
            // Fall back to treating it as a raw string if parsing fails
            }
      }
      return trimmed || null;
    }
    const parts = [addr.street, addr.city, addr.state, addr.country].map(p => p?.trim()).filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formattedAddress = formatAddress(tenant.address as Address | string | null | undefined);

  // Build tenantInfo for the Información básica tab
  const tenantInfo = {
    name: tenant.name,
    whatsapp_phone: tenant.whatsapp_phone,
    address: formattedAddress,
    social_links: tenant.social_links,
    public_settings: tenant.public_settings,
  };

  return (
    <main 
      className="min-h-screen bg-zinc-50 dark:bg-black pb-24"
      style={{
        "--brand-color": brandColor,
        "--secondary-color": secondaryColor,
      } as React.CSSProperties}
    >
      {/* Header is now rendered inside StorefrontFavoritesWrapper to share category state */}

      {/* Catalog with tabs and favorites */}
      <StorefrontFavoritesWrapper
        categories={categories}
        sellerHero={{
          tenantName: tenant.name,
          description: `Tu tienda de confianza en ${formattedAddress || "Ecuador"}`,
          address: formattedAddress,
          logoUrl: tenant.logo_url || null,
          bannerUrl: null,
          stats: {
            rating: "4.7",
            ratingCount: "1.1 mil",
            sales: "5.1 mil",
            age: "2.5 años",
          },
          lastActive: "Activo hoy",
        }}
        products={displayedProducts}
        tenantId={tenant.id}
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        whatsappPhone={tenant.whatsapp_phone}
        initialFavoriteIds={favoriteIds}
        initialFavoriteProducts={userFavorites}
        tenantName={tenant.name}
        isAuthenticated={!!user}
        tenantInfo={tenantInfo}
        sections={tenantSections}
      />

      {/* Conversion Banner (Growth Loop) for Free Plan */}
      {isFreePlan && (
        <div className="max-w-4xl mx-auto px-4 mt-12">
          <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-3xl p-8 text-white shadow-xl text-center space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:text-left gap-6">
            <div className="space-y-2 max-w-xl">
              <h3 className="text-xl md:text-2xl font-black tracking-tight">
                ¿Quieres vender por WhatsApp como esta tienda?
              </h3>
              <p className="text-orange-100 text-sm md:text-base font-medium">
                Crea tu propio catálogo digital gratis con Tenddy Shop en minutos.
              </p>
            </div>
            <a
              href="https://iapi.shop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white text-orange-600 font-bold px-6 py-3.5 rounded-2xl hover:bg-orange-50 transition-all active:scale-95 shadow-lg whitespace-nowrap"
            >
              Comenzar gratis
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-900 border-t py-8 mt-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
            </p>
            {tenant.public_settings?.show_address !== false && formattedAddress && (
              <p className="text-xs text-muted-foreground font-medium">
                Dirección: {formattedAddress}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            {LEGAL_LINKS_ENABLED && (
              <>
                <LegalFooterLinks mode="inline" separator=" | " />
                <StoreReportButton tenantId={tenant.id} tenantName={tenant.name} />
              </>
            )}
            <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
              Potenciado por Tenddy Shop
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Cart Drawer */}
      <CartDrawer whatsapp={tenant.whatsapp_phone} tenantName={tenant.name} tenantId={tenant.id} />
    </main>
  );
}

// Re-export Product type for downstream components
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  image_urls?: string[];
  category_id?: string;
}