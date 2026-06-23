"use client"

import Image from "next/image"
import { Package, Heart } from "lucide-react"
import { AddToCartButton } from "@/components/storefront/add-to-cart-button"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    compare_at_price?: number | null
    image_urls?: string[]
    tenant_id?: string | null
    description?: string | null
    tenant_name?: string | null
    tenant_slug?: string | null
  }
  isFavorited: boolean
  onToggleFavorite: (productId: string) => void
  isAuthenticated?: boolean
  onCardClick?: () => void
  showAddToCart?: boolean
}

export function ProductCard({ product, isFavorited, onToggleFavorite, onCardClick, showAddToCart = true }: ProductCardProps) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount 
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100) 
    : 0

  return (
    <article
      onClick={() => onCardClick?.()}
      className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 group cursor-pointer"
    >
      {/* Image container */}
      <div className="aspect-[4/5] bg-muted relative overflow-hidden">
        {product.image_urls?.[0] ? (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-xl"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <Package className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          </div>
        )}



        {/* Avatar circle - top right */}
        <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-[10px] font-bold text-zinc-500">
          👤
        </div>

        {/* Heart favorite button - bottom left of image */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(product.id) }}
          className="absolute bottom-2 left-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all z-10"
          aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-red-500'}`} 
          />
        </button>

        {showAddToCart && product.tenant_id && (
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_urls?.[0],
              tenant_id: product.tenant_id,
            }}
            className="absolute bottom-2 right-2 h-7 w-7 z-10"
          />
        )}
      </div>

      {/* Product info */}
      <div className="p-2.5 space-y-1">
        {/* Name - 1 line truncated */}
        <h3 className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100 line-clamp-1 leading-tight">
          {product.name}
        </h3>

        {/* Current price - green */}
        <p className="text-green-700 dark:text-green-400 font-bold text-sm">
          ${Number(product.price).toFixed(2)}
        </p>

        {/* Previous price with discount - only if real */}
        {hasDiscount && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            <span className="line-through">${Number(product.compare_at_price).toFixed(2)}</span>
            {" "}
            <span className="text-red-500 font-bold">-{discountPercent}%</span>
          </p>
        )}

        {/* Free shipping badge */}
        <div className="pt-1">
          <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded">
            Envío GRATIS
          </span>
        </div>
      </div>
    </article>
  )
}