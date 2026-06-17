"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/storefront/cart-store"
import { toast } from "sonner"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    image_url?: string
    tenant_id: string
  }
  className?: string
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem)

  return (
    <button
      className={`h-7 w-7 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-zinc-900 hover:shadow transition-all ${className ?? ""}`}
      style={{ color: "var(--brand-color)" }}
      aria-label={`Agregar ${product.name} al carrito`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        addItem(product.tenant_id, {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url
        })
        toast.success(`${product.name} agregado`, {
          duration: 1500,
          position: "bottom-center",
          className: "text-xs font-bold",
        })
      }}
    >
      <ShoppingBag className="h-4 w-4" />
    </button>
  )
}