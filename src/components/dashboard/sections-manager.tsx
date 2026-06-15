"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Package, Search, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createSection, updateSection, deleteSection, getSectionProducts, addProductToSection, removeProductFromSection, Section } from "@/lib/sections/actions"
import { createClient } from "@/lib/supabase/client"

interface ProductSearchResult {
  id: string
  name: string
  price: number
  image_url: string | null
}

interface SectionsManagerProps {
  sections: Section[]
  tenantId: string | null
  isAdmin?: boolean
}

export function SectionsManager({ sections: initialSections, tenantId }: SectionsManagerProps) {
  const [sections, setSections] = React.useState(initialSections)
  const [editing, setEditing] = React.useState<Section | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")

  // Product assignment dialog state
  const [productDialogSection, setProductDialogSection] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<ProductSearchResult[]>([])
  const [assignedProducts, setAssignedProducts] = React.useState<{ id: string; name: string; price: number; image_urls: string[] }[]>([])
  const [searching, setSearching] = React.useState(false)

  const openNew = () => {
    setEditing(null)
    setName("")
    setSlug("")
    setDescription("")
    setDialogOpen(true)
  }

  const openEdit = (s: Section) => {
    setEditing(s)
    setName(s.name)
    setSlug(s.slug)
    setDescription(s.description || "")
    setDialogOpen(true)
  }

  const generateSlug = (n: string) => n.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const handleSave = async () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return }
    const finalSlug = slug.trim() || generateSlug(name)

    if (editing) {
      const result = await updateSection(editing.id, { name: name.trim(), slug: finalSlug, description: description.trim() || null })
      if (result.success) {
        toast.success("Sección actualizada")
        setSections(prev => prev.map(s => s.id === editing.id ? { ...s, name: name.trim(), slug: finalSlug, description: description.trim() || null } : s))
        setDialogOpen(false)
      } else toast.error(result.error || "Error")
    } else {
      const result = await createSection(name.trim(), finalSlug, tenantId ?? undefined, description.trim() || undefined)
      if (result.success && result.data) {
        toast.success("Sección creada")
        setSections(prev => [...prev, { id: result.data!.id, name: name.trim(), slug: finalSlug, description: description.trim() || null, tenant_id: tenantId, image_url: null, display_order: prev.length, is_active: true }])
        setDialogOpen(false)
      } else toast.error(result.error || "Error")
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteSection(id)
    if (result.success) {
      toast.success("Sección eliminada")
      setSections(prev => prev.filter(s => s.id !== id))
    } else toast.error(result.error || "Error")
  }

  const handleToggleActive = async (s: Section) => {
    const result = await updateSection(s.id, { is_active: !s.is_active })
    if (result.success) {
      setSections(prev => prev.map(sec => sec.id === s.id ? { ...sec, is_active: !s.is_active } : sec))
    }
  }

  const openProductDialog = async (section: Section) => {
    setProductDialogSection(section.id)
    setSearchQuery("")
    setSearchResults([])
    const result = await getSectionProducts(section.id)
    if (result.success && result.data) {
      setAssignedProducts(result.data)
    } else {
      setAssignedProducts([])
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("products")
      .select("id, name, price, product_images(url)")
      .eq("is_active", true)
      .eq("approved_for_marketplace", true)
      .ilike("name", `%${q}%`)
      .limit(10)
    setSearchResults((data || []).map((p: { id: string; name: string; price: number; product_images: { url: string }[] | null }) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: (p.product_images ?? [])[0]?.url ?? null,
    })))
    setSearching(false)
  }

  return (
    <div className="space-y-4">
      <Button onClick={openNew} className="rounded-xl font-bold gap-2">
        <Plus className="h-4 w-4" /> Nueva Sección
      </Button>

      {sections.length === 0 ? (
        <div className="py-12 text-center border rounded-3xl bg-muted/20">
          <p className="text-muted-foreground font-medium">No hay secciones todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border">
              <div className="flex items-center gap-3">
                <button onClick={() => handleToggleActive(s)} className={`text-xs font-bold px-2 py-0.5 rounded ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-400'}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </button>
                <span className="font-bold">{s.name}</span>
                <span className="text-xs text-muted-foreground">/{s.slug}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openProductDialog(s)} className="h-8 rounded-lg text-xs font-bold">
                  <Package className="h-3.5 w-3.5 mr-1" /> Productos
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="h-8 w-8 rounded-lg"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-8 w-8 rounded-lg text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? "Editar Sección" : "Nueva Sección"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Nombre</label>
              <Input value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)) }} placeholder="Día de la Madre" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Slug</label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="dia-de-la-madre" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Descripción</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Productos especiales para..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="w-full rounded-xl font-bold bg-orange-500 hover:bg-orange-600">{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Assignment Dialog */}
      <Dialog open={!!productDialogSection} onOpenChange={() => setProductDialogSection(null)}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Productos de la sección</DialogTitle>
          </DialogHeader>

          {/* Search to add */}
          <div className="space-y-2">
            <label className="text-sm font-bold">Buscar y agregar producto</label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="rounded-xl flex-1"
              />
            </div>
            {searching && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
            {searchResults.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground mr-2">${p.price}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg text-xs"
                  onClick={async () => {
                    const result = await addProductToSection(productDialogSection!, p.id)
                    if (result.success) {
                      toast.success("Producto agregado")
                      setAssignedProducts(prev => [...prev, { id: p.id, name: p.name, price: p.price, image_urls: p.image_url ? [p.image_url] : [] }])
                      setSearchResults(prev => prev.filter(r => r.id !== p.id))
                    } else toast.error(result.error || "Error")
                  }}
                >
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
            ))}
          </div>

          {/* Assigned products list */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-bold">Productos asignados ({assignedProducts.length})</label>
            {assignedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin productos</p>
            ) : (
              assignedProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-8 w-8 rounded object-cover" />}
                    <span className="text-sm font-medium truncate">{p.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-lg text-xs text-red-500"
                    onClick={async () => {
                      const result = await removeProductFromSection(productDialogSection!, p.id)
                      if (result.success) {
                        toast.success("Producto quitado")
                        setAssignedProducts(prev => prev.filter(r => r.id !== p.id))
                      } else toast.error(result.error || "Error")
                    }}
                  >
                    <X className="h-3 w-3" /> Quitar
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}