import { getStorefrontData } from "@/lib/storefront/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle, MapPin, Phone, Package, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { CartDrawer } from "@/components/storefront/cart-drawer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStorefrontData(slug);
  
  if (!data.success || !data.tenant) {
    return { title: "Sucursal no encontrada" };
  }

  return {
    title: `${data.tenant.name} | Catálogo Digital`,
    description: `Mira los productos de ${data.tenant.name} y haz tu pedido por WhatsApp.`,
  };
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getStorefrontData(slug);

  if (!data.success || !data.tenant) {
    notFound();
  }

  const { tenant, categories = [], products = [] } = data;
  const whatsappUrl = tenant.whatsapp_phone 
    ? `https://wa.me/${tenant.whatsapp_phone.replace(/\+/g, "")}?text=Hola! Vengo de tu catálogo digital y me gustaría hacer una consulta.`
    : "#";

  // Inyección de color de marca dinámico
  const brandColor = tenant.brand_color || "#7c3aed";

  return (
    <main 
      className="min-h-screen bg-zinc-50 dark:bg-black pb-24"
      style={{ "--brand-primary": brandColor } as React.CSSProperties}
    >
      {/* Header / Hero */}
      <header className="bg-white dark:bg-zinc-900 border-b pb-8">
        <div className="h-32 w-full" style={{ backgroundColor: brandColor }} />
        <div className="max-w-4xl mx-auto px-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-xl border-4 border-white dark:border-zinc-900 bg-zinc-100 overflow-hidden shadow-xl relative text-[var(--brand-primary)]">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} fill className="object-cover" />
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
            <Button render={<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" />} className="rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold px-6 shadow-lg shadow-green-200 dark:shadow-none">
              <MessageCircle className="mr-2 h-4 w-4" /> Chatear
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <section key={category.id} className="mb-12">
              <h2 
                className="text-xl font-black uppercase tracking-widest mb-6 border-l-4 pl-4 text-pretty"
                style={{ color: brandColor, borderColor: brandColor }}
              >
                {category.name}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {products
                  ?.filter((p) => p.category_id === category.id)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} tenantId={tenant.id} brandColor={brandColor} />
                  ))}
              </div>
            </section>
          ))
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} tenantId={tenant.id} brandColor={brandColor} />
            ))}
          </div>
        )}

        {(!products || products.length === 0) && (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed text-[var(--brand-primary)]">
            <p className="font-medium opacity-80">Esta sucursal aún no tiene productos disponibles.</p>
          </div>
        )}
      </div>

      {/* Info de contacto y Redes (Footer) */}
      <footer className="bg-white dark:bg-zinc-900 border-t py-12 mt-12 px-6">
        <div className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-2 text-center sm:text-left">
          <div className="space-y-4">
            <h4 className="font-black text-lg">Visítanos</h4>
            {tenant.address ? (
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
                {tenant.address}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs italic">Dirección no especificada.</p>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-lg">Síguenos</h4>
            <div className="flex justify-center sm:justify-start gap-4">
              {tenant.social_links?.instagram && (
                <a href={tenant.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-primary)] transition-colors">
                  <Share2 className="h-5 w-5" />
                </a>
              )}
              {tenant.social_links?.facebook && (
                <a href={tenant.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-primary)] transition-colors">
                  <Share2 className="h-5 w-5" />
                </a>
              )}
              {tenant.social_links?.tiktok && (
                <a href={tenant.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-muted hover:text-[var(--brand-primary)] transition-colors">
                  <Share2 className="h-5 w-5" />
                </a>
              )}
              {!tenant.social_links?.instagram && !tenant.social_links?.facebook && !tenant.social_links?.tiktok && (
                <p className="text-muted-foreground text-xs italic">Redes no especificadas.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-50">
          Potenciado por IAPI Shop
        </div>
      </footer>

      {/* Floating Cart Drawer */}
      <CartDrawer whatsapp={tenant.whatsapp_phone} tenantName={tenant.name} tenantId={tenant.id} />
    </main>
  );
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
  category_id?: string;
}

function ProductCard({ product, tenantId, brandColor }: { product: Product, tenantId: string, brandColor: string }) {
  return (
    <article className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
      <div className="h-24 w-24 rounded-xl bg-muted overflow-hidden relative shrink-0 border">
        {product.image_urls?.[0] ? (
          <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--brand-primary)] transition-colors">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-black" style={{ color: brandColor }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <AddToCartButton product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_urls?.[0],
            tenant_id: tenantId
          }} />
        </div>
      </div>
    </article>
  );
}
