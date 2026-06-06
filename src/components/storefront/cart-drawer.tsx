"use client"

import * as React from "react"
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useCart, CartItem } from "@/lib/storefront/cart-store"
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
import { toast } from "sonner"
import { createOrder } from "@/lib/orders/actions"
import { formatCartMessage, buildWhatsAppCartUrl } from "@/lib/utils/whatsapp"

export function CartDrawer({ whatsapp, tenantName, tenantId }: { whatsapp?: string, tenantName: string, tenantId: string }) {
  const { updateQuantity, getTenantItems, getTenantTotal, removeItem, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const filteredItems: CartItem[] = getTenantItems(tenantId)
  const total = getTenantTotal(tenantId)
  const itemCount = filteredItems.length

  const handleCheckout = async () => {
    if (filteredItems.length === 0) return
    setIsProcessing(true)

    try {
      // 1. Persist the order for analytics (best-effort — WhatsApp is still sent on failure)
      const orderResult = await createOrder({
        tenant_id: tenantId,
        total_amount: total,
        items: filteredItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity
        })),
        notes: `Pedido desde catálogo digital ${tenantName}`
      })

      if (!orderResult.success) {
        toast.error("Error al procesar el pedido internamente. Intentando por WhatsApp…")
      }

      // 2. Format the WhatsApp message via the utility
      const orderRef = orderResult.success && orderResult.data
        ? orderResult.data.slice(-6).toUpperCase()
        : undefined

      const message = formatCartMessage(tenantName, filteredItems, { orderRef })
      const whatsappUrl = whatsapp
        ? buildWhatsAppCartUrl(whatsapp, message)
        : `https://wa.me/?text=${encodeURIComponent(message)}`

      toast.success("¡Pedido generado! Abriendo WhatsApp…")

      // 3. Clear the cart for this tenant
      clearCart(tenantId)

      // 4. Open WhatsApp
      window.open(whatsappUrl, "_blank")
    } catch (error) {
      toast.error("Ocurrió un error al procesar tu compra.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Drawer>
      <DrawerTrigger render={
        <Button 
          aria-label="Abrir carrito"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-xl shadow-2xl text-white z-50 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "var(--brand-color)" }}
        >
          <div className="relative">
            <ShoppingBag className="h-7 w-7" />
            {itemCount > 0 && (
              <span 
                className="absolute -top-3 -right-3 bg-white text-[10px] font-black h-5 w-5 rounded-xl flex items-center justify-center border-2 animate-in zoom-in"
                style={{ color: "var(--brand-color)", borderColor: "var(--brand-color)" }}
              >
                {itemCount}
              </span>
            )}
          </div>
        </Button>
      } />
      <DrawerContent className="rounded-t-3xl max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle 
              className="text-2xl font-black flex items-center gap-2"
              style={{ color: "var(--brand-color)" }}
            >
              Tu Carrito <ShoppingBag className="h-5 w-5" />
            </DrawerTitle>
            <DrawerDescription>
              Revisa tus productos antes de enviar el pedido.
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="h-[50vh] p-6">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                <p className="font-bold text-foreground text-center text-xl">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden relative shrink-0 border">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-violet-50">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                      <p 
                        className="font-black text-sm tabular-nums"
                        style={{ color: "var(--brand-color)" }}
                      >${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Disminuir cantidad"
                        className="h-8 w-8 rounded-xl" 
                        onClick={() => updateQuantity(tenantId, item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-4 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Incrementar cantidad"
                        className="h-8 w-8 rounded-xl" 
                        onClick={() => updateQuantity(tenantId, item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label="Eliminar producto"
                      className="text-destructive h-8 w-8 rounded-xl" 
                      onClick={() => removeItem(tenantId, item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DrawerFooter className="border-t p-6 bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Total Estimado</span>
              <span 
                className="text-3xl font-black tabular-nums"
                style={{ color: "var(--brand-color)" }}
              >${total.toFixed(2)}</span>
            </div>
            <Button 
              className="w-full rounded-xl font-black py-8 text-white shadow-lg text-lg transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "var(--brand-color)" }}
              disabled={filteredItems.length === 0 || isProcessing}
              onClick={handleCheckout}
            >
              {isProcessing ? "Procesando…" : (
                <>
                  <MessageCircle className="mr-2 h-6 w-6" /> Pedir por WhatsApp
                </>
              )}
            </Button>
            {filteredItems.length > 0 && (
              <Button 
                variant="ghost" 
                className="rounded-xl font-bold mt-2 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => clearCart(tenantId)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Vaciar carrito
              </Button>
            )}
            <DrawerClose render={<Button variant="ghost" className="rounded-xl font-bold mt-2 w-full text-muted-foreground" />}>
              Continuar comprando
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
