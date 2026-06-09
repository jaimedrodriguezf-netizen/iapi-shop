"use client"

import { useState, useMemo, useCallback } from "react"
import Image from "next/image"
import { Package, MessageCircle } from "lucide-react"
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
  parent_id?: string | null
}

interface StorefrontCatalogProps {
  categories: Category[]
  products: Product[]
  tenantId: string
  brandColor: string
  whatsappPhone?: string
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
  whatsappPhone,
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Category filter chips (3 levels cascading) */}
      {(visibleL1Categories.length > 1 || (visibleL1Categories.length === 1 && visibleL2Categories.length > 0)) && (
        <div className="space-y-4 mb-8">
          {/* L1 Categories */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedL1(null)
                setSelectedL2(null)
                setSelectedL3(null)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                selectedL1 === null
                  ? "text-white shadow-md border-transparent"
                  : "bg-white dark:bg-zinc-900 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
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
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  selectedL1 === category.id
                    ? "text-white shadow-md border-transparent"
                    : "bg-white dark:bg-zinc-900 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
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

          {/* L2 Categories */}
          {selectedL1 && visibleL2Categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setSelectedL2(null)
                  setSelectedL3(null)
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedL2 === null
                    ? "text-white shadow-sm border-transparent"
                    : "bg-slate-50 dark:bg-zinc-950 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
                }`}
                style={
                  selectedL2 === null
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Todos en {categories.find(c => c.id === selectedL1)?.name}
              </button>
              {visibleL2Categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedL2(category.id)
                    setSelectedL3(null)
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    selectedL2 === category.id
                      ? "text-white shadow-sm border-transparent"
                      : "bg-slate-50 dark:bg-zinc-950 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
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

          {/* L3 Categories */}
          {selectedL2 && selectedL2 !== "none" && visibleL3Categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => {
                  setSelectedL3(null)
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${
                  selectedL3 === null
                    ? "text-white border-transparent"
                    : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
                }`}
                style={
                  selectedL3 === null
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                Todos en {categories.find(c => c.id === selectedL2)?.name}
              </button>
              {visibleL3Categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedL3(category.id)
                  }}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${
                    selectedL3 === category.id
                      ? "text-white border-transparent"
                      : "bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:text-[var(--brand-color)] hover:border-[var(--brand-color)]"
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
        <section className="mb-12">
          <h2
            className="text-xl font-black uppercase tracking-widest mb-6 border-l-4 pl-4 text-pretty"
            style={{ color: brandColor, borderColor: brandColor }}
          >
            {activeCategoryName}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantId={tenantId}
                whatsappPhone={whatsappPhone}
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
                <section key={category.id} className="mb-12">
                  <h2
                    className="text-xl font-black uppercase tracking-widest mb-6 border-l-4 pl-4 text-pretty"
                    style={{ color: brandColor, borderColor: brandColor }}
                  >
                    {category.name}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {catProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        tenantId={tenantId}
                        whatsappPhone={whatsappPhone}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  tenantId={tenantId}
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
  whatsappPhone,
}: {
  product: Product
  tenantId: string
  whatsappPhone?: string
}) {
  // Deterministic mock data to create a lively Temu-style layout
  const hash = product.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Mock discount: 30%, 40%, 50%, or 60%
  const discountPercent = 30 + (hash % 4) * 10 // 30%, 40%, 50%, 60%
  const originalPrice = product.price / (1 - discountPercent / 100)
  
  // Mock sales count: e.g. 100+ to 9k+
  const salesCount = hash % 2 === 0 
    ? `${(hash % 9) + 1}k+ vendidos` 
    : `${(hash % 450) + 50}+ vendidos`
    
  // Mock rating: e.g. 4.6 to 4.9
  const rating = (4.6 + (hash % 4) * 0.1).toFixed(1)
  const reviewsCount = (hash % 180) + 12

  // Mock badge type
  const showFireBadge = hash % 3 === 0
  const showTopRated = hash % 3 === 1

  return (
    <article className="flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-850 transition-all duration-300 overflow-hidden group relative">
      {/* Top badges (Overlay on image) */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm tracking-wide uppercase">
          -{discountPercent}%
        </span>
        {showFireBadge && (
          <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5 uppercase tracking-wide">
            🔥 Caliente
          </span>
        )}
        {showTopRated && (
          <span className="bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5 uppercase tracking-wide">
            ⭐ Top
          </span>
        )}
      </div>

      {/* Image container */}
      <div className="aspect-[4/5] bg-muted overflow-hidden relative border-b border-slate-100 dark:border-zinc-800 shrink-0">
        {product.image_urls?.[0] ? (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-slate-50 dark:bg-zinc-950">
            <Package className="h-8 w-8 opacity-40" />
          </div>
        )}
        {/* Shipping badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
          Envío gratis
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 justify-between">
        <div className="space-y-1">
          {/* Rating and Reviews */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-amber-500 font-bold">★</span>
            <span className="font-bold text-slate-700 dark:text-zinc-300">{rating}</span>
            <span className="text-muted-foreground text-[10px]">({reviewsCount})</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-slate-500 dark:text-zinc-400 text-[10px] font-medium">{salesCount}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-zinc-100 leading-snug group-hover:text-[var(--brand-color)] transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
              {product.description}
            </p>
          )}
        </div>

        {/* Pricing and Actions */}
        <div className="mt-3 pt-2 border-t border-slate-50 dark:border-zinc-800/50">
          {/* Price line-through */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="line-through">${originalPrice.toFixed(2)}</span>
            <span className="text-red-500 font-bold text-[9px]">Ahorras ${(originalPrice - product.price).toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between mt-1 gap-2">
            {/* Promo Price */}
            <span className="font-black text-sm sm:text-base tracking-tight text-red-500 dark:text-red-400">
              ${Number(product.price).toFixed(2)}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {whatsappPhone && (
                <a
                  href={buildWhatsAppUrl(whatsappPhone, product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-xs shrink-0 active:scale-95 transition-transform flex items-center justify-center"
                  aria-label={`Pedir ${product.name} por WhatsApp`}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
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
      </div>
    </article>
  )
}