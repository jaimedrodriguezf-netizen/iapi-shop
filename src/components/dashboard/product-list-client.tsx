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
import { getProducts, deleteProduct } from "@/lib/products/actions"
import { toast } from "sonner"
import Image from "next/image"

export type Product = {
  id: string
  name: string
  price: number
  is_active: boolean
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

export function ProductListClient({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = React.useState<ProductWithCategory[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Estado Unificado para el Modal de Formulario (Crear/Editar)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  
  // Estados para Eliminación
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

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
                <span className="text-[10px] uppercase font-black text-violet-600">{product.categories.name}</span>
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
        <span className="font-mono font-bold text-violet-600">
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
                  onSelect={() => {
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
                  onSelect={() => {
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
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar productos..." className="pl-10 rounded-xl" />
        </div>
        
        {/* Botón para CREAR */}
        <Button 
          onClick={() => {
            setSelectedProduct(null)
            setIsModalOpen(true)
          }}
          className="rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Agregar Producto
        </Button>
      </header>

      {/* Modal Unificado (Crear/Editar) */}
      <ProductFormModal 
        tenantId={tenantId}
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
          <p className="text-sm text-muted-foreground animate-pulse font-medium text-violet-600">Actualizando catálogo...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={products} />
      )}
    </div>
  )
}
