"use client"

import { ProductCard } from "@/components/storefront/product-card"

interface ProductItem {
  id: string
  name: string
  price: number
  compare_at_price?: number | null
  image_urls?: string[]
  category_id?: string
}

interface StorefrontProductGridProps {
  products: ProductItem[]
  tenantId: string
  brandColor: string
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  isAuthenticated: boolean
}

export function StorefrontProductGrid({
  products, favoriteIds, onToggleFavorite,
}: StorefrontProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-400 dark:text-zinc-500 font-medium text-sm">
          No hay productos disponibles todavía.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorited={favoriteIds.includes(product.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}