"use client"

import { Plus } from "lucide-react"
import { useCart } from "@/lib/storefront/cart-store"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    image_url?: string
    tenant_id: string
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem)

  return (
    <Button 
      size="icon"
      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
      onClick={() => {
        addItem(product.tenant_id, {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url
        })
        toast.success(`${product.name} agregado al carrito`, {
          duration: 2000,
          position: "bottom-center"
        })
      }}
    >
      <Plus className="h-5 w-5" />
    </Button>
  )
}
