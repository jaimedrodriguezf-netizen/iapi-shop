"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/lib/storefront/cart-store"

export function MarketplaceCartIcon() {
  // Sum items across all tenants for the marketplace
  const carts = useCart((state) => state.carts)
  const totalItems = Object.values(carts).reduce((sum, items) => sum + items.reduce((s, i) => s + i.quantity, 0), 0)

  return (
    <div className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      <ShoppingBag className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
      {totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </div>
  )
}
