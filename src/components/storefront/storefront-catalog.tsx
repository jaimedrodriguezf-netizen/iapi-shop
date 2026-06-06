"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Package, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddToCartButton } from "@/components/storefront/add-to-cart-button"
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_urls?: string[]
  category_id?: string
}

interface Category {
  id: string
  name: string
}

interface StorefrontCatalogProps {
  categories: Category[]
  products: Product[]
  tenantId: string
  brandColor: string
  whatsappPhone?: string
}

export function StorefrontCatalog({
  categories,
  products,
  tenantId,
  brandColor,
  whatsappPhone,
}: StorefrontCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((p) => p.category_id === selectedCategory)
  }, [products, selectedCategory])

  // Only show categories that have at least one product
  const visibleCategories = useMemo(
    () =>
      categories.filter((cat) =>
        products.some((p) => p.category_id === cat.id)
      ),
    [categories, products]
  )

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Category filter chips */}
      {visibleCategories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedCategory === null
                ? "text-white shadow-md"
                : "bg-white dark:bg-zinc-900 border text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
            }`}
            style={
              selectedCategory === null
                ? { backgroundColor: brandColor }
                : undefined
            }
          >
            Todos
          </button>
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === category.id
                  ? "text-white shadow-md"
                  : "bg-white dark:bg-zinc-900 border text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
              }`}
              style={
                selectedCategory === category.id
                  ? { backgroundColor: brandColor }
                  : undefined
              }
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      {selectedCategory ? (
        <section className="mb-12">
          <h2
            className="text-xl font-black uppercase tracking-widest mb-6 border-l-4 pl-4 text-pretty"
            style={{ color: brandColor, borderColor: brandColor }}
          >
            {visibleCategories.find((c) => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantId={tenantId}
                brandColor={brandColor}
                whatsappPhone={whatsappPhone}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          {visibleCategories.length > 0 ? (
            visibleCategories.map((category) => (
              <section key={category.id} className="mb-12">
                <h2
                  className="text-xl font-black uppercase tracking-widest mb-6 border-l-4 pl-4 text-pretty"
                  style={{ color: brandColor, borderColor: brandColor }}
                >
                  {category.name}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {products
                    .filter((p) => p.category_id === category.id)
                    .map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        tenantId={tenantId}
                        brandColor={brandColor}
                        whatsappPhone={whatsappPhone}
                      />
                    ))}
                </div>
              </section>
            ))
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  tenantId={tenantId}
                  brandColor={brandColor}
                  whatsappPhone={whatsappPhone}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {(!products || products.length === 0) && (
        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed text-[var(--brand-color)]">
          <p className="font-medium opacity-80">
            Esta sucursal aún no tiene productos disponibles.
          </p>
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  tenantId,
  brandColor,
  whatsappPhone,
}: {
  product: Product
  tenantId: string
  brandColor: string
  whatsappPhone?: string
}) {
  return (
    <article className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
      <div className="h-24 w-24 rounded-xl bg-muted overflow-hidden relative shrink-0 border">
        {product.image_urls?.[0] ? (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-[var(--brand-color)] transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="font-black" style={{ color: brandColor }}>
            ${Number(product.price).toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            {whatsappPhone && (
              <Button
                render={
                  <a
                    href={buildWhatsAppUrl(whatsappPhone, product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                size="icon"
                className="rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-sm"
                aria-label={`Pedir ${product.name} por WhatsApp`}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_urls?.[0],
                tenant_id: tenantId,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}