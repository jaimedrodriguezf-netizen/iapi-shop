"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useCart } from "@/lib/storefront/cart-store"
import { createClient } from "@/lib/supabase/client"
import { createOrder } from "@/lib/orders/actions"
import { formatCartMessage, buildWhatsAppCartUrl } from "@/lib/utils/whatsapp"
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
import { toast } from "sonner"

interface TenantDetails {
  id: string
  name: string
  slug: string
  whatsapp_phone?: string | null
}

interface MarketplaceCartDrawerProps {
  searchOpen?: boolean
}

export function MarketplaceCartDrawer({ searchOpen }: MarketplaceCartDrawerProps) {
  const carts = useCart((state) => state.carts)
  const { updateQuantity, removeItem, clearCart } = useCart()
  const [tenants, setTenants] = React.useState<Record<string, TenantDetails>>({})
  const [isProcessing, setIsProcessing] = React.useState<Record<string, boolean>>({})

  // Compute overall total cart items
  const totalCartItems = Object.values(carts).reduce(
    (sum, items) => sum + items.reduce((s, i) => s + i.quantity, 0),
    0
  )

  // Identify tenant ids in the cart that have items
  const activeTenantIds = React.useMemo(() => {
    return Object.keys(carts).filter((id) => carts[id] && carts[id].length > 0)
  }, [carts])

  const activeTenantIdsStr = React.useMemo(() => {
    return activeTenantIds.sort().join(",")
  }, [activeTenantIds])

  // Fetch tenant details dynamically
  React.useEffect(() => {
    if (activeTenantIds.length === 0) return

    const fetchTenants = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name, slug, whatsapp_phone")
          .in("id", activeTenantIds)

        if (error) {
          console.error("Error fetching tenants:", error)
          return
        }

        if (data) {
          const newTenantsMap: Record<string, TenantDetails> = {}
          data.forEach((t) => {
            newTenantsMap[t.id] = {
              id: t.id,
              name: t.name,
              slug: t.slug,
              whatsapp_phone: t.whatsapp_phone,
            }
          })
          setTenants((prev) => ({ ...prev, ...newTenantsMap }))
        }
      } catch (err) {
        console.error("Failed to fetch tenants:", err)
      }
    }

    fetchTenants()
  }, [activeTenantIdsStr])

  const handleCheckout = async (
    tenantId: string,
    tenantName: string,
    whatsapp: string | undefined | null,
    items: typeof carts[string],
    subtotal: number
  ) => {
    if (items.length === 0) return
    setIsProcessing((prev) => ({ ...prev, [tenantId]: true }))

    try {
      // 1. Create order in database
      const orderResult = await createOrder({
        tenant_id: tenantId,
        total_amount: subtotal,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
        })),
        notes: "Pedido multitienda desde Tenddy Shop",
      })

      if (!orderResult.success) {
        toast.error("Error al procesar el pedido internamente. Intentando por WhatsApp…")
      }

      // 2. Format message
      const orderRef =
        orderResult.success && orderResult.data
          ? orderResult.data.slice(-6).toUpperCase()
          : undefined

      const message = formatCartMessage(tenantName, items, { orderRef })

      // 3. Form WhatsApp URL
      const whatsappUrl = whatsapp
        ? buildWhatsAppCartUrl(whatsapp, message)
        : `https://wa.me/?text=${encodeURIComponent(message)}`

      toast.success("¡Pedido generado! Abriendo WhatsApp…")

      // 4. Clear cart for this specific tenant
      clearCart(tenantId)

      // 5. Redirect to WhatsApp
      window.open(whatsappUrl, "_blank")
    } catch (err) {
      console.error("Checkout error:", err)
      toast.error("Ocurrió un error al procesar tu compra.")
    } finally {
      setIsProcessing((prev) => ({ ...prev, [tenantId]: false }))
    }
  }

  return (
    <Drawer>
      <DrawerTrigger render={
        <button
          aria-label="Abrir carrito"
          className={`relative p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 transition-all active:scale-95 cursor-pointer ${
            searchOpen ? "hidden sm:block" : ""
          }`}
        >
          <ShoppingBag className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {totalCartItems > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-white text-[9px] font-black flex items-center justify-center border animate-in zoom-in"
              style={{
                backgroundColor: "oklch(0.65 0.22 50)",
                borderColor: "oklch(0.65 0.22 50)",
              }}
            >
              {totalCartItems > 9 ? "9+" : totalCartItems}
            </span>
          )}
        </button>
      } />

      <DrawerContent className="rounded-l-3xl w-full sm:max-w-md h-full flex flex-col" side="right">
        <DrawerHeader className="border-b pb-4 shrink-0">
          <DrawerTitle
            className="text-2xl font-black flex items-center gap-2"
            style={{ color: "oklch(0.65 0.22 50)" }}
          >
            Tu Carrito <ShoppingBag className="h-5 w-5" />
          </DrawerTitle>
          <DrawerDescription>
            Revisa tus productos agrupados por tienda.
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-6">
          {activeTenantIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 opacity-50 py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <p className="font-bold text-foreground text-center text-xl">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {activeTenantIds.map((tenantId) => {
                const tenant = tenants[tenantId]
                const items = carts[tenantId] || []
                const subtotal = items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                )
                const isTenantProcessing = isProcessing[tenantId] || false

                return (
                  <div
                    key={tenantId}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 bg-card text-card-foreground shadow-sm space-y-4"
                  >
                    {/* Store Header */}
                    <div className="flex items-center justify-between border-b pb-3">
                      {tenant ? (
                        <Link
                          href={`/${tenant.slug}`}
                          className="font-black text-base hover:opacity-80 flex items-center gap-1.5 transition-opacity"
                          style={{ color: "oklch(0.65 0.22 50)" }}
                        >
                          {tenant.name}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="font-bold text-sm text-muted-foreground animate-pulse">
                          Cargando tienda...
                        </span>
                      )}
                    </div>

                    {/* Store Items */}
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1"
                        >
                          <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden relative shrink-0 border border-zinc-100 dark:border-zinc-800">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs truncate text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </h4>
                            <p
                              className="font-black text-xs tabular-nums"
                              style={{ color: "oklch(0.65 0.22 50)" }}
                            >
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-zinc-800/60 rounded-xl p-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Disminuir cantidad"
                              className="h-6 w-6 rounded-lg cursor-pointer"
                              onClick={() =>
                                updateQuantity(tenantId, item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-3 text-center text-[11px] font-black tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Incrementar cantidad"
                              className="h-6 w-6 rounded-lg cursor-pointer"
                              onClick={() =>
                                updateQuantity(tenantId, item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar producto"
                            className="text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg cursor-pointer shrink-0"
                            onClick={() => removeItem(tenantId, item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal and Actions */}
                    <div className="border-t pt-3 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium uppercase tracking-wider">
                          Subtotal
                        </span>
                        <span className="font-black text-base text-zinc-900 dark:text-zinc-100 tabular-nums">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          className="w-full rounded-2xl font-black py-5 text-white shadow-sm text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          style={{ backgroundColor: "oklch(0.65 0.22 50)" }}
                          disabled={isTenantProcessing || !tenant}
                          onClick={() =>
                            handleCheckout(
                              tenantId,
                              tenant?.name || "Tienda",
                              tenant?.whatsapp_phone,
                              items,
                              subtotal
                            )
                          }
                        >
                          <MessageCircle className="h-4 w-4 shrink-0" />
                          {isTenantProcessing ? "Procesando…" : `Pedir a ${tenant?.name || "Tienda"} por WhatsApp`}
                        </Button>

                        <Button
                          variant="ghost"
                          className="rounded-2xl font-bold text-xs text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer flex items-center justify-center gap-1.5 h-9"
                          onClick={() => clearCart(tenantId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Vaciar carrito
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DrawerFooter className="border-t p-6 bg-muted/20 shrink-0">
          <DrawerClose render={
            <Button variant="outline" className="w-full rounded-2xl font-bold text-sm cursor-pointer h-11">
              Seguir explorando
            </Button>
          } />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
