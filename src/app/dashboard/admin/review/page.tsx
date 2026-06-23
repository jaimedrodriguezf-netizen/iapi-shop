"use client"

import * as React from "react"
import { getPendingMarketplaceProducts, reviewMarketplaceProduct } from "@/lib/products/actions"
import { getPendingReports, updateReportStatus } from "@/lib/legal/actions"
import type { StoreReport } from "@/lib/legal/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import Image from "next/image"
import { Package, Check, X, Flag, FileWarning } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function AdminReviewPage() {
  const [activeTab, setActiveTab] = React.useState("productos")

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Revisión de Marketplace</h1>
        <p className="text-muted-foreground italic mt-1">Revisa productos y reportes de tiendas</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="productos">
            <Package className="h-4 w-4 mr-1" /> Productos
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <Flag className="h-4 w-4 mr-1" /> Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="reportes">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductsTab() {
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
    if (!res.success) {
      toast.error(res.error || "Error al cargar productos pendientes")
    } else if (res.data) {
      setProducts(res.data)
    }
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="space-y-4">
      {products.map(product => (
        <Card key={product.id} className="rounded-3xl border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted border">
                {product.image_urls?.[0] ? (
                  <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover rounded-xl" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-bold text-lg truncate">{product.name}</h3>
                <p className="text-orange-500 font-mono font-bold">${Number(product.price).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Creado: {new Date(product.created_at).toLocaleDateString("es-EC")}</p>
              </div>
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
  )
}

function ReportsTab() {
  const [reports, setReports] = React.useState<StoreReport[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modNotes, setModNotes] = React.useState<Record<string, string>>({})

  const fetchReports = React.useCallback(async () => {
    setLoading(true)
    const res = await getPendingReports()
    if (!res.success) {
      toast.error(res.error || "Error al cargar reportes")
    } else if (res.data) {
      setReports(res.data)
    }
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { fetchReports() }, [fetchReports])

  async function handleStatusChange(reportId: string, status: "reviewed" | "actioned" | "dismissed") {
    const notes = modNotes[reportId]
    const res = await updateReportStatus(reportId, status, notes)
    if (res.success) {
      toast.success("✅ Reporte actualizado")
      setModNotes(prev => { const r = { ...prev }; delete r[reportId]; return r })
      fetchReports()
    } else {
      toast.error(res.error || "Error al actualizar reporte")
    }
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando reportes pendientes...</div>

  if (reports.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <FileWarning className="h-12 w-12 text-green-400 mx-auto" />
        <p className="text-muted-foreground font-medium">No hay reportes pendientes de revisión</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground italic">{reports.length} reporte(s) pendiente(s)</p>
      {reports.map(report => (
        <Card key={report.id} className="rounded-3xl border shadow-sm">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  <span className="font-bold text-sm">{report.reason}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  De: {report.reporter_email} · {new Date(report.created_at).toLocaleDateString("es-EC")}
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground/80 line-clamp-3">
              {report.details}
            </p>

            <div className="space-y-2 pt-2">
              <Textarea
                placeholder="Notas del moderador (opcional)..."
                className="rounded-xl text-xs h-16 resize-none"
                value={modNotes[report.id] || ""}
                onChange={e => setModNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(report.id, "actioned")}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Tomar acción
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(report.id, "reviewed")}
                  className="rounded-xl text-xs font-bold"
                >
                  Marcar revisado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(report.id, "dismissed")}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Descartar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}