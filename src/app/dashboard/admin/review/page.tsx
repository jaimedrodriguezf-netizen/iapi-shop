"use client"

import * as React from "react"
import { getPendingMarketplaceProducts, reviewMarketplaceProduct } from "@/lib/products/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { Package, Check, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function AdminReviewPage() {
  const [products, setProducts] = React.useState<Array<{
    id: string
    name: string
    price: number
    tenant_id: string
    image_urls: string[]
    created_at: string
  }>>([])
  const [loading, setLoading] = React.useState(true)
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({})

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    const res = await getPendingMarketplaceProducts()
    if (res.success && res.data) {
      setProducts(res.data)
    } else {
      toast.error(res.error || "Error al cargar productos pendientes")
    }
    setLoading(false)
  }, [])

  React.useEffect(() => { fetchProducts() }, [fetchProducts])

  async function handleReview(productId: string, action: "approve" | "reject") {
    const reason = action === "reject" ? rejectReason[productId] : undefined
    const res = await reviewMarketplaceProduct(productId, action, reason)
    if (res.success) {
      toast.success(action === "approve" ? "✅ Producto aprobado" : "❌ Producto rechazado")
      setRejectReason(prev => { const r = { ...prev }; delete r[productId]; return r })
      fetchProducts()
    } else {
      toast.error(res.error || "Error al revisar producto")
    }
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando productos pendientes...</div>

  if (products.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <Check className="h-12 w-12 text-green-400 mx-auto" />
        <p className="text-muted-foreground font-medium">No hay productos pendientes de revisión</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Revisión de Marketplace</h1>
        <p className="text-muted-foreground italic mt-1">{products.length} producto(s) pendiente(s) de revisión</p>
      </div>

      <div className="space-y-4">
        {products.map(product => (
          <Card key={product.id} className="rounded-3xl border shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Image */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted border">
                  {product.image_urls?.[0] ? (
                    <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover rounded-xl" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="font-bold text-lg truncate">{product.name}</h3>
                  <p className="text-orange-500 font-mono font-bold">${Number(product.price).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Creado: {new Date(product.created_at).toLocaleDateString("es-EC")}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
                  <Button onClick={() => handleReview(product.id, "approve")} className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold w-full">
                    <Check className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                  
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Motivo de rechazo (opcional)..."
                      className="rounded-xl text-xs h-16 resize-none"
                      value={rejectReason[product.id] || ""}
                      onChange={e => setRejectReason(prev => ({ ...prev, [product.id]: e.target.value }))}
                    />
                    <Button variant="outline" onClick={() => handleReview(product.id, "reject")} className="rounded-xl w-full border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm">
                      <X className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
