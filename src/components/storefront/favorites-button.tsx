"use client"

import * as React from "react"
import { Heart, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface FavoriteProduct {
  id: string
  name: string
  price: number
  image_url?: string
}

interface FavoritesButtonProps {
  products: FavoriteProduct[]
  itemCount: number
  whatsappPhone?: string
  tenantName: string
  onRemoveFavorite: (productId: string) => void
}

export function FavoritesButton({ products, itemCount, whatsappPhone, tenantName, onRemoveFavorite }: FavoritesButtonProps) {
  const handleSendFavorites = () => {
    if (products.length === 0 || !whatsappPhone) return
    const items = products.map(p => `• ${p.name} - $${p.price.toFixed(2)}`).join("\n")
    const total = products.reduce((sum, p) => sum + p.price, 0)
    const message = `Hola! Me interesan estos productos de ${tenantName}:\n\n${items}\n\nTotal estimado: $${total.toFixed(2)}`
    const url = `https://wa.me/${whatsappPhone.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  return (
    <Drawer>
      <DrawerTrigger render={
        <Button
          aria-label="Favoritos"
          className="fixed bottom-24 right-6 h-12 w-12 rounded-xl shadow-xl text-white z-40 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#ef4444" }}
        >
          <div className="relative">
            <Heart className="h-5 w-5 fill-white" />
            {itemCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 text-[10px] font-black h-5 w-5 rounded-full bg-white text-red-500 flex items-center justify-center border-2 border-red-500">
                {itemCount}
              </span>
            )}
          </div>
        </Button>
      } />
      <DrawerContent className="rounded-t-3xl max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl font-black flex items-center gap-2 text-red-500">
              <Heart className="h-5 w-5 fill-red-500" /> Favoritos
            </DrawerTitle>
            <DrawerDescription>
              {products.length > 0 
                ? `${itemCount} producto${itemCount !== 1 ? 's' : ''} guardado${itemCount !== 1 ? 's' : ''}` 
                : "No tenes productos favoritos todavia"}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[50vh] p-4">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-40 space-y-3">
                <Heart className="h-12 w-12" />
                <p className="font-bold text-lg">Sin favoritos</p>
                <p className="text-xs text-muted-foreground">Toca el corazon en un producto para guardarlo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden shadow-sm">
                    <div className="aspect-square bg-muted relative">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ShoppingBag className="h-6 w-6 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className="text-[11px] font-semibold line-clamp-1">{product.name}</p>
                      <p className="text-xs font-bold" style={{ color: "var(--brand-color)" }}>${product.price.toFixed(2)}</p>
                      <button
                        onClick={() => onRemoveFavorite(product.id)}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {products.length > 0 && (
            <DrawerFooter className="border-t p-4">
              {whatsappPhone && (
                <Button
                  className="w-full rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleSendFavorites}
                >
                  Pedir favoritos por WhatsApp
                </Button>
              )}
              <DrawerClose render={<Button variant="ghost" className="w-full rounded-xl font-bold">Cerrar</Button>} />
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}