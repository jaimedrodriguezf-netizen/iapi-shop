"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Heart, ShoppingBag, Package } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart } from "@/lib/storefront/cart-store"

interface ProductDetailModalProps {
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
  } | null
  isOpen: boolean
  onClose: () => void
  isFavorited: boolean
  onToggleFavorite: (productId: string) => void
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
}: ProductDetailModalProps) {
  const addItem = useCart((state) => state.addItem)

  if (!product) return null

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  const handleAddToCart = () => {
    if (!product.tenant_id) {
      toast.error("Error al agregar al carrito: No se encontró el comercio")
      return
    }

    addItem(product.tenant_id, {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_urls?.[0],
    })

    toast.success(`${product.name} agregado`, {
      duration: 1500,
      position: "bottom-center",
      className: "text-xs font-bold",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl md:max-w-4xl rounded-3xl p-0 overflow-hidden gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh] md:max-h-[85vh] overflow-y-auto md:overflow-hidden">
          {/* Left / Top: Image Container */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden min-h-[300px]">
            {product.image_urls?.[0] ? (
              <Image
                src={product.image_urls[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
              </div>
            )}
          </div>

          {/* Right / Bottom: Product Details */}
          <div className="flex flex-col p-6 sm:p-8 justify-between h-full bg-white dark:bg-zinc-900">
            <div className="space-y-4">
              {/* Store link */}
              {product.tenant_name && product.tenant_slug && (
                <div>
                  <Link
                    href={`/${product.tenant_slug}`}
                    className="font-bold text-xs hover:underline inline-flex items-center gap-1"
                    style={{ color: "oklch(0.65 0.22 50)" }}
                  >
                    Vendido por: {product.tenant_name}{" "}
                    <ExternalLink className="inline h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Product Name */}
              <DialogTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                {product.name}
              </DialogTitle>

              {/* Price & Discount */}
              <div className="flex items-baseline gap-2">
                <span className="text-green-700 dark:text-green-400 font-bold text-xl sm:text-2xl">
                  ${Number(product.price).toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 line-through">
                      ${Number(product.compare_at_price).toFixed(2)}
                    </span>
                    <span className="text-sm text-red-500 font-bold">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Descripción
                </h4>
                <div className="overflow-y-auto max-h-[150px] sm:max-h-[220px] pr-2 scrollbar-thin">
                  <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                    {product.description || "Este producto no tiene descripción."}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "oklch(0.65 0.22 50)",
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                Agregar al carrito
              </button>

              <button
                onClick={() => onToggleFavorite(product.id)}
                className="h-12 w-12 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isFavorited
                      ? "fill-red-500 text-red-500"
                      : "text-zinc-500 hover:text-red-500 dark:text-zinc-400"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
