"use client"

import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { Package } from "lucide-react"
import { AddToCartButton } from "@/components/storefront/add-to-cart-button"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
  category_id?: string
}

interface Category {
  id: string
  name: string
  parent_id?: string | null
}

interface StorefrontCatalogProps {
  categories: Category[]
  products: Product[]
  tenantId: string
  brandColor: string
  secondaryColor?: string
  whatsappPhone?: string
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  isAuthenticated: boolean
}

function getCategoryDescendants(categories: Category[], catId: string): string[] {
  const ids = [catId];
  const directChildren = categories.filter(c => c.parent_id === catId);
  for (const child of directChildren) {
    ids.push(...getCategoryDescendants(categories, child.id));
  }
  return ids;
}

export function StorefrontCatalog({
  categories,
  products,
  tenantId,
  brandColor,
  secondaryColor,
  whatsappPhone: _whatsappPhone,
  favoriteIds,
  onToggleFavorite,
}: StorefrontCatalogProps) {
  const [selectedL1, setSelectedL1] = useState<string | null>(null)
  const [selectedL2, setSelectedL2] = useState<string | null>(null)
  const [selectedL3, setSelectedL3] = useState<string | null>(null)

  const getDescendants = useCallback((catId: string): string[] => {
    return getCategoryDescendants(categories, catId);
  }, [categories]);

  const activeCategoryId = selectedL3 || selectedL2 || selectedL1;

  const filteredProducts = useMemo(() => {
    if (!activeCategoryId) return products
    const allowedIds = getDescendants(activeCategoryId)
    return products.filter((p) => p.category_id && allowedIds.includes(p.category_id))
  }, [products, activeCategoryId, getDescendants])

  const visibleL1Categories = useMemo(() => {
    return categories
      .filter((cat) => !cat.parent_id)
      .filter((cat) => {
        const allowedIds = getDescendants(cat.id);
        return products.some((p) => p.category_id && allowedIds.includes(p.category_id));
      });
  }, [categories, products, getDescendants]);

  const visibleL2Categories = useMemo(() => {
    if (!selectedL1) return [];
    return categories
      .filter((cat) => cat.parent_id === selectedL1)
      .filter((cat) => {
        const allowedIds = getDescendants(cat.id);
        return products.some((p) => p.category_id && allowedIds.includes(p.category_id));
      });
  }, [categories, products, selectedL1, getDescendants]);

  const visibleL3Categories = useMemo(() => {
    if (!selectedL2) return [];
    return categories
      .filter((cat) => cat.parent_id === selectedL2)
      .filter((cat) => {
        return products.some((p) => p.category_id === cat.id);
      });
  }, [categories, products, selectedL2]);

  const activeCategoryName = useMemo(() => {
    if (!activeCategoryId) return "";
    return categories.find((c) => c.id === activeCategoryId)?.name || "";
  }, [categories, activeCategoryId]);

  return (
    <div 
      className="max-w-4xl mx-auto px-4 py-8"
      style={{
        "--secondary-color": secondaryColor || "#bae6fd"
      } as React.CSSProperties}
    >
      {/* Category filter chips - horizontal scroll */}
      {(visibleL1Categories.length > 1 || (visibleL1Categories.length === 1 && visibleL2Categories.length > 0)) && (
        <div className="space-y-3 mb-6">
          {/* L1 Categories - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => {
                setSelectedL1(null)
                setSelectedL2(null)
                setSelectedL3(null)
              }}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedL1 === null
                  ? "text-white shadow-sm border-transparent"
                  : "bg-white dark:bg-zinc-900 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
              }`}
              style={
                selectedL1 === null
                  ? { backgroundColor: brandColor }
                  : undefined
              }
            >
              Todos
            </button>
            {visibleL1Categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedL1(category.id)
                  setSelectedL2(null)
                  setSelectedL3(null)
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedL1 === category.id
                    ? "text-white shadow-sm border-transparent"
                    : "bg-white dark:bg-zinc-900 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                }`}
                style={
                  selectedL1 === category.id
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* L2 Categories - horizontal scroll */}
          {selectedL1 && visibleL2Categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedL2(null)
                  setSelectedL3(null)
                }}
                className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${
                  selectedL2 === null
                    ? "text-white border-transparent"
                    : "bg-zinc-50 dark:bg-zinc-950 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                }`}
                style={
                  selectedL2 === null
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Todos
              </button>
              {visibleL2Categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedL2(category.id)
                    setSelectedL3(null)
                  }}
                  className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${
                    selectedL2 === category.id
                      ? "text-white border-transparent"
                      : "bg-zinc-50 dark:bg-zinc-950 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                  }`}
                  style={
                    selectedL2 === category.id
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* L3 Categories - horizontal scroll */}
          {selectedL2 && visibleL3Categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedL3(null)
                }}
                className={`shrink-0 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                  selectedL3 === null
                    ? "text-white border-transparent"
                    : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                }`}
                style={
                  selectedL3 === null
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Todos
              </button>
              {visibleL3Categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedL3(category.id)
                  }}
                  className={`shrink-0 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                    selectedL3 === category.id
                      ? "text-white border-transparent"
                      : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:text-[var(--secondary-color)] hover:border-[var(--secondary-color)]"
                  }`}
                  style={
                    selectedL3 === category.id
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product grid */}
      {activeCategoryId ? (
        <section className="mb-10">
          <h2
            className="text-lg font-black uppercase tracking-widest mb-4 border-l-4 pl-3"
            style={{ color: brandColor, borderColor: brandColor }}
          >
            {activeCategoryName}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantId={tenantId}
                isFavorited={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          {visibleL1Categories.length > 0 ? (
            visibleL1Categories.map((category) => {
              const allowedIds = getDescendants(category.id);
              const catProducts = products.filter((p) => p.category_id && allowedIds.includes(p.category_id));
              if (catProducts.length === 0) return null;
              return (
                <section key={category.id} className="mb-10">
                  <h2
                    className="text-lg font-black uppercase tracking-widest mb-4 border-l-4 pl-3"
                    style={{ color: brandColor, borderColor: brandColor }}
                  >
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {catProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        tenantId={tenantId}
                        isFavorited={favoriteIds.includes(product.id)}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  tenantId={tenantId}
                  isFavorited={favoriteIds.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {(!products || products.length === 0) && (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed">
          <div className="flex flex-col items-center gap-3 opacity-40">
            <Package className="h-10 w-10" />
            <p className="font-medium">
              Esta sucursal aún no tiene productos disponibles.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({
  product,
  tenantId,
  isFavorited,
  onToggleFavorite,
}: {
  product: Product & { compare_at_price?: number | null }
  tenantId: string
  isFavorited: boolean
  onToggleFavorite: (productId: string) => void
}) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) 
    : 0;

  return (
    <article className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden group hover:shadow-sm transition-shadow">
      {/* Image container with overlay buttons */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image_urls?.[0] ? (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-zinc-50 dark:bg-zinc-950">
            <Package className="h-8 w-8 opacity-30" />
          </div>
        )}
        
        {/* Heart/favorite button - top right */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(product.id); }}
          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition-all z-10"
          aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          {isFavorited ? (
            <svg className="h-4 w-4 text-red-500 fill-red-500" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          ) : (
            <svg className="h-4 w-4 text-zinc-500 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
          )}
        </button>

        {/* Add to cart button - bottom right */}
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_urls?.[0],
            tenant_id: tenantId,
          }}
          className="absolute bottom-1.5 right-1.5"
        />
      </div>

      {/* Product info - compact */}
      <div className="p-2 space-y-0.5">
        {/* Name - 1 line */}
        <h3 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-1 leading-tight">
          {product.name}
        </h3>
        
        {/* Price */}
        <p className="text-sm font-bold" style={{ color: "var(--brand-color)" }}>
          ${Number(product.price).toFixed(2)}
        </p>

        {/* Discount - only if real compare_at_price exists */}
        {hasDiscount && (
          <p className="text-[11px] text-muted-foreground">
            <span className="line-through">${Number(product.compare_at_price).toFixed(2)}</span>
            {" "}
            <span className="text-red-500 font-bold">-{discountPercent}%</span>
          </p>
        )}
      </div>
    </article>
  )
}