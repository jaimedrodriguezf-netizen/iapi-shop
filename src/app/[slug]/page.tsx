import { getStorefrontData } from "@/lib/storefront/actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle, MapPin, Phone, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

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

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header / Hero */}
      <header className="bg-white dark:bg-zinc-900 border-b pb-8">
        <div className="h-32 bg-gradient-to-r from-orange-500 to-orange-600 w-full" />
        <div className="max-w-4xl mx-auto px-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-xl border-4 border-white dark:border-zinc-900 bg-zinc-100 overflow-hidden shadow-xl relative">
              {tenant.logo_url ? (
                <Image src={tenant.logo_url} alt={tenant.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-orange-600 bg-orange-50">
                  {tenant.name[0]}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-black tracking-tight">{tenant.name}</h1>
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
              <h2 className="text-xl font-black uppercase tracking-widest text-orange-600 mb-6 border-l-4 border-orange-500 pl-4">
                {category.name}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {products
                  ?.filter((p) => p.category_id === category.id)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} whatsapp={tenant.whatsapp_phone} />
                  ))}
              </div>
            </section>
          ))
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} whatsapp={tenant.whatsapp_phone} />
            ))}
          </div>
        )}

        {(!products || products.length === 0) && (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed">
            <p className="text-muted-foreground font-medium">Esta sucursal aún no tiene productos disponibles.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-xs text-muted-foreground">
        <p>Potenciado por <span className="font-black text-orange-600">IAPI Shop</span></p>
      </footer>
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

function ProductCard({ product, whatsapp }: { product: Product, whatsapp?: string }) {
  const whatsappUrl = whatsapp 
    ? `https://wa.me/${whatsapp.replace(/\+/g, "")}?text=Hola! Me interesa el producto: ${product.name}`
    : "#";

  return (
    <article className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm hover:shadow-md transition-shadow group">
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
          <h3 className="font-bold text-lg leading-tight group-hover:text-orange-600 transition-colors">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-orange-600">${Number(product.price).toFixed(2)}</span>
          <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
