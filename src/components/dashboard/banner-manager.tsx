"use client"

import React, { useState, useTransition } from "react"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  PromoBanner,
} from "@/lib/admin/banner-actions"

interface BannerManagerProps {
  banners: PromoBanner[]
}

const COLOR_PRESETS = [
  "#f97316", // orange
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ec4899", // pink
]

export function BannerManager({ banners: initialBanners }: BannerManagerProps) {
  const [banners, setBanners] = React.useState<PromoBanner[]>(initialBanners)
  const [isPending, startTransition] = useTransition()
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formSubtitle, setFormSubtitle] = useState("")
  const [formCtaText, setFormCtaText] = useState("")
  const [formCtaHref, setFormCtaHref] = useState("#")
  const [formBgColor, setFormBgColor] = useState("#f97316")
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formDisplayOrder, setFormDisplayOrder] = useState(0)
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setFormTitle("")
    setFormSubtitle("")
    setFormCtaText("")
    setFormCtaHref("#")
    setFormBgColor("#f97316")
    setFormImageUrl("")
    setFormIsActive(true)
    setFormDisplayOrder(banners.length)
  }

  const openCreate = () => {
    resetForm()
    setIsCreating(true)
    setEditingBanner(null)
  }

  const openEdit = (banner: PromoBanner) => {
    setFormTitle(banner.title)
    setFormSubtitle(banner.subtitle || "")
    setFormCtaText(banner.cta_text || "")
    setFormCtaHref(banner.cta_href || "#")
    setFormBgColor(banner.bg_color)
    setFormImageUrl(banner.image_url || "")
    setFormIsActive(banner.is_active)
    setFormDisplayOrder(banner.display_order)
    setEditingBanner(banner)
    setIsCreating(false)
  }

  const closeDialog = () => {
    setEditingBanner(null)
    setIsCreating(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    // Validate file size (5MB max before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB")
      return
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten imágenes PNG, JPEG o WebP")
      return
    }

    setUploading(true)
    const toastId = toast.loading("Comprimiendo imagen...")
    try {
      // Client-side compression via Canvas
      const compressedFile = await compressImage(file, 1440, 0.8)
      
      const result = await uploadBannerImage(compressedFile)
      if (result.success && result.data) {
        setFormImageUrl(result.data.url)
        toast.success("Imagen subida y comprimida", { id: toastId })
      } else {
        toast.error(result.error || "Error al subir imagen", { id: toastId })
      }
    } catch {
      toast.error("Error al procesar imagen", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error("El título es obligatorio")
      return
    }

    startTransition(async () => {
      if (editingBanner) {
        const result = await updateBanner(editingBanner.id, {
          title: formTitle,
          subtitle: formSubtitle || null,
          cta_text: formCtaText || null,
          cta_href: formCtaHref || "#",
          bg_color: formBgColor,
          image_url: formImageUrl || null,
          is_active: formIsActive,
          display_order: formDisplayOrder,
        })
        if (result.success) {
          toast.success("Banner actualizado")
          setBanners(prev =>
            prev.map(b =>
              b.id === editingBanner.id
                ? { ...b, title: formTitle, subtitle: formSubtitle || null, cta_text: formCtaText || null, cta_href: formCtaHref || "#", bg_color: formBgColor, image_url: formImageUrl || null, is_active: formIsActive, display_order: formDisplayOrder }
                : b
            )
          )
          closeDialog()
        } else {
          toast.error(result.error || "Error al actualizar")
        }
      } else {
        const result = await createBanner({
          title: formTitle,
          subtitle: formSubtitle || null,
          cta_text: formCtaText || null,
          cta_href: formCtaHref || "#",
          bg_color: formBgColor,
          image_url: formImageUrl || null,
          display_order: formDisplayOrder,
          is_active: formIsActive,
        })
        if (result.success && result.data) {
          toast.success("Banner creado")
          setBanners(prev => [
            ...prev,
            {
              id: result.data!.id,
              title: formTitle,
              subtitle: formSubtitle || null,
              cta_text: formCtaText || null,
              cta_href: formCtaHref || "#",
              bg_color: formBgColor,
              image_url: formImageUrl || null,
              display_order: formDisplayOrder,
              is_active: formIsActive,
            },
          ])
          closeDialog()
        } else {
          toast.error("Error al crear banner")
        }
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteBanner(id)
      if (result.success) {
        toast.success("Banner eliminado")
        setBanners(prev => prev.filter(b => b.id !== id))
      } else {
        toast.error(result.error || "Error al eliminar")
      }
    })
  }

  const handleToggleActive = (banner: PromoBanner) => {
    startTransition(async () => {
      const result = await updateBanner(banner.id, { is_active: !banner.is_active })
      if (result.success) {
        setBanners(prev =>
          prev.map(b => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        )
        toast.success(banner.is_active ? "Banner desactivado" : "Banner activado")
      } else {
        toast.error(result.error || "Error al cambiar estado")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No hay banners todavía.</p>
      ) : (
        <div className="space-y-3">
          {banners
            .sort((a, b) => a.display_order - b.display_order)
            .map((banner) => (
              <div
                key={banner.id}
                className={`rounded-xl border p-4 flex items-center gap-4 transition-opacity ${
                  banner.is_active ? "opacity-100" : "opacity-60"
                }`}
              >
                {/* Color preview */}
                <div
                  className="h-10 w-10 rounded-lg shrink-0"
                  style={{ backgroundColor: banner.bg_color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{banner.title}</span>
                    {!banner.is_active && (
                      <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(banner)}
                    title={banner.is_active ? "Desactivar" : "Activar"}
                  >
                    {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(banner)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(banner.id)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={!!editingBanner || isCreating} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Nuevo Banner"}</DialogTitle>
            <DialogDescription>
              {editingBanner ? "Modificá los datos del banner" : "Creá un nuevo banner para el marketplace"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej: Catálogo Digital Gratis"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subtítulo</label>
              <Input
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Ej: Creá tu tienda en minutos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto del botón</label>
                <Input
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  placeholder="Ej: Crear Tienda"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link del botón</label>
                <Input
                  value={formCtaHref}
                  onChange={(e) => setFormCtaHref(e.target.value)}
                  placeholder="/register"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color de fondo</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-lg border-2 transition-transform ${
                        formBgColor === color ? "border-zinc-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormBgColor(color)}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formBgColor}
                  onChange={(e) => setFormBgColor(e.target.value)}
                  className="h-8 w-12 p-0 cursor-pointer border-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de fondo</label>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                📐 1440×400px — JPG/PNG/WebP, máx 5MB (se comprime a WebP automáticamente)
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <span className="text-xs text-muted-foreground">Subiendo...</span>}
              </div>
              {formImageUrl && (
                <p className="text-xs text-muted-foreground truncate">Imagen cargada</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="is-active" className="text-sm font-medium">Activo</label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || !formTitle.trim()}>
              {isPending ? "Guardando..." : editingBanner ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Client-side image compression using Canvas API.
 * Resizes to maxWidth and converts to WebP at given quality.
 * Returns a new File ready for upload.
 */
async function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      
      // Draw on canvas
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file) // fallback: return original file
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
          })
          resolve(compressed)
        },
        "image/webp",
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // fallback on error
    }
    
    img.src = url
  })
}