"use client"

import * as React from "react"
import { MoreHorizontal, Package, Search, Trash2, Edit2, Plus } from "lucide-react"
import { DataTable } from "@/components/dashboard/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ProductFormModal } from "./product-form-modal"
import { getProducts, deleteProduct, toggleMarketplaceApproval, requestMarketplaceApproval } from "@/lib/products/actions"
import { toast } from "sonner"
import Image from "next/image"

export type Product = {
  id: string
  name: string
  price: number
  is_active: boolean
  approved_for_marketplace?: boolean
  marketplace_status?: string
  created_at: string
  category_id?: string
  description?: string
  image_urls?: string[]
}

interface ProductWithCategory extends Product {
  categories?: {
    name: string;
  } | null;
}

export function ProductListClient({ 
  tenantId, 
  planName = "Starter", 
  productLimit = 50,
  platformRole = "merchant"
}: { 
  tenantId: string; 
  planName?: string; 
  productLimit?: number;
  platformRole?: string;
}) {
  const [products, setProducts] = React.useState<ProductWithCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  // Estado Unificado para el Modal de Formulario (Crear/Editar)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  
  // Estados para Eliminación
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  // Filtrar productos por término de búsqueda
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm.trim()) return products
    const term = searchTerm.toLowerCase()
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.categories?.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    )
  }, [products, searchTerm])

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    const result = await getProducts(tenantId)
    if (result.success && result.products) {
      setProducts(result.products as ProductWithCategory[])
    }
    setLoading(false)
  }, [tenantId])

  React.useEffect(() => {
    const init = async () => {
      await fetchProducts()
    }
    init()
  }, [fetchProducts])

  async function handleDelete() {
    if (!deletingProduct) return
    const res = await deleteProduct(deletingProduct.id, tenantId)
    if (res.success) {
      toast.success("Producto eliminado")
      setIsDeleteDialogOpen(false)
      setDeletingProduct(null)
      fetchProducts()
    } else {
      toast.error("Error al eliminar")
    }
  }

  async function handleRequestApproval(productId: string) {
    const res = await requestMarketplaceApproval(productId, tenantId)
    if (res.success) {
      toast.success("Producto enviado a revisión")
      fetchProducts()
    } else {
      toast.error(res.error || "Error al solicitar publicación")
    }
  }

  async function handleAdminReject(productId: string) {
    const m = await import("@/lib/products/actions")
    const res = await m.reviewMarketplaceProduct(productId, "reject")
    if (res.success) {
      toast.success("Producto rechazado")
      fetchProducts()
    } else {
      toast.error(res.error || "Error al rechazar")
    }
  }

  async function handleToggleApproval(productId: string) {
    const res = await toggleMarketplaceApproval(productId, tenantId)
    if (res.success) {
      toast.success(res.approved ? "Producto aprobado para marketplace" : "Producto desaprobado del marketplace")
      fetchProducts()
    } else {
      toast.error(res.error || "Error al actualizar aprobación")
    }
  }

  const marketplaceStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "pending": return <Badge className="rounded-full bg-yellow-100 text-yellow-800 border-yellow-300 text-[10px]">Pendiente</Badge>
      case "approved": return <Badge className="rounded-full bg-green-100 text-green-800 border-green-300 text-[10px]">✓ Aprobado</Badge>
      case "rejected": return <Badge className="rounded-full bg-red-100 text-red-800 border-red-300 text-[10px]">Rechazado</Badge>
      default: return null
    }
  }

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      accessorKey: "name",
      header: "Producto",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-muted text-muted-foreground border">
              {product.image_urls?.[0] ? (
                <Image src={product.image_urls[0]} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold">{String(row.getValue("name"))}</span>
              {product.categories?.name && (
                <span className="text-[10px] uppercase font-black text-orange-500">{product.categories.name}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "price",
      header: "Precio",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-orange-500">
          ${Number(row.getValue("price")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.getValue("is_active") ? "default" : "secondary"} className="rounded-full">
          {row.getValue("is_active") ? "Activo" : "Pausado"}
        </Badge>
      ),
    },
    {
      id: "marketplace" as const,
      header: "Marketplace",
      cell: ({ row }: { row: { original: ProductWithCategory } }) => {
        const product = row.original
        const status = product.marketplace_status || "none"

        // Admin: quick approve/reject
        if (platformRole === "admin") {
          if (status === "pending") {
            return (
              <div className="flex gap-1">
                <Button size="sm" className="text-xs rounded-lg bg-green-600 hover:bg-green-700 h-7" onClick={() => handleToggleApproval(product.id)}>
                  ✓ Aprobar
                </Button>
                <Button size="sm" variant="outline" className="text-xs rounded-lg h-7" onClick={() => {
                  // Simple reject without reason for quick actions
                  import("@/lib/products/actions").then(m => m.reviewMarketplaceProduct(product.id, "reject")).then(r => {
                    if (r.success) { toast.success("Producto rechazado"); fetchProducts() }
                    else toast.error(r.error || "Error")
                  })
                }}>
                  ✕
                </Button>
              </div>
            )
          }
          return marketplaceStatusBadge(status)
        }

        // Merchant: request or show status
        if (status === "none") {
          return (
            <Button size="sm" variant="outline" className="text-xs rounded-lg h-7 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={() => handleRequestApproval(product.id)}>
              📢 Publicar
            </Button>
          )
        }
        return marketplaceStatusBadge(status)
      },
    } satisfies ColumnDef<ProductWithCategory>,
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" />}>
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setTimeout(() => {
                      setSelectedProduct(product)
                      setIsModalOpen(true)
                    }, 100)
                  }} 
                  className="cursor-pointer font-medium"
                >
                  <Edit2 className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setTimeout(() => {
                      setDeletingProduct(product)
                      setIsDeleteDialogOpen(true)
                    }, 100)
                  }} 
                  className="text-destructive cursor-pointer font-medium"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar productos..." 
              className="pl-10 rounded-xl" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Contador de Productos */}
          <div className="flex items-center gap-3 border bg-muted/30 rounded-xl px-3.5 py-1.5 text-xs font-semibold w-fit">
            <span className="text-muted-foreground">Productos ({planName}):</span>
            <span className="font-black text-orange-500 font-mono">{products.length} / {productLimit}</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${products.length >= productLimit ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(100, (products.length / productLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Botón para CREAR */}
        <Button 
          onClick={() => {
            if (products.length >= productLimit) {
              toast.error(`Límite alcanzado: el plan ${planName} permite máximo ${productLimit} productos.`)
              return
            }
            setSelectedProduct(null)
            setIsModalOpen(true)
          }}
          disabled={products.length >= productLimit}
          className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar Producto
        </Button>
      </header>

      {/* Modal Unificado (Crear/Editar) */}
      <ProductFormModal 
        tenantId={tenantId}
        planName={planName}
        platformRole={platformRole}
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchProducts}
      />

      {/* Alerta para ELIMINAR */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto <span className="font-bold text-foreground">&quot;{deletingProduct?.name}&quot;</span> será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl font-bold" onClick={() => setDeletingProduct(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold"
            >
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed">
          <p className="text-sm text-muted-foreground animate-pulse font-medium text-orange-500">Actualizando catálogo...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredProducts} />
      )}
    </div>
  )
}
