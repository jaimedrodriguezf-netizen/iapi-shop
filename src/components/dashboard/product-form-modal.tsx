"use client"

import * as React from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createProduct, updateProduct, getCategories, createCategory, uploadProductImage } from "@/lib/products/actions"
import Image from "next/image"

const baseProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Ingresa un precio válido.",
  }),
  category_id: z.string().optional(),
  description: z.string().optional(),
  image_urls: z.array(z.string()),
})

interface Category {
  id: string;
  name: string;
}

interface ProductFormModalProps {
  tenantId: string
  planName?: string
  product: {
    id: string;
    name: string;
    price: number;
    category_id?: string;
    description?: string;
    image_urls?: string[];
  } | null // null significa crear
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductFormModal({ tenantId, planName = "free", product, open, onOpenChange, onSuccess }: ProductFormModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = React.useState("")

  const isEditing = !!product

  const maxImages = React.useMemo(() => {
    const plan = planName.toLowerCase()
    if (plan === "business") return 6
    if (plan === "pro") return 3
    if (plan === "starter") return 3
    return 1
  }, [planName])

  const productSchema = React.useMemo(() => baseProductSchema.extend({
    image_urls: z.array(z.string()).max(maxImages, `El plan ${planName} permite un máximo de ${maxImages} ${maxImages === 1 ? "foto" : "fotos"}.`),
  }), [maxImages, planName])

  const form = useForm<z.infer<typeof baseProductSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "0",
      category_id: "",
      description: "",
      image_urls: [],
    },
  })

  const loadCategories = React.useCallback(async () => {
    const res = await getCategories(tenantId)
    if (res.success && res.categories) {
      setCategories(res.categories as Category[])
    }
  }, [tenantId])

  React.useEffect(() => {
    if (open) {
      loadCategories()
      if (product) {
        form.reset({
          name: product.name,
          price: product.price.toString(),
          category_id: product.category_id || "",
          description: product.description || "",
          image_urls: product.image_urls || [],
        })
      } else {
        form.reset({
          name: "",
          price: "0",
          category_id: "",
          description: "",
          image_urls: [],
        })
      }
    }
  }, [open, loadCategories, product, form])

  async function handleCreateCategory() {
    if (!newCategoryName) return
    const res = await createCategory(tenantId, newCategoryName)
    if (res.success) {
      toast.success("Categoría creada")
      setNewCategoryName("")
      loadCategories()
    } else {
      toast.error(res.error || "No se pudo crear la categoría")
    }
  }

  async function onSubmit(values: z.infer<typeof baseProductSchema>) {
    try {
      const payload = {
        tenant_id: tenantId,
        category_id: values.category_id,
        name: values.name,
        description: values.description,
        price: Number(values.price),
        image_urls: values.image_urls,
      }

      const result = isEditing && product
        ? await updateProduct(product.id, tenantId, payload)
        : await createProduct(payload)

      if (result.success) {
        toast.success(isEditing ? "Producto actualizado" : "¡Producto agregado!")
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(result.error || "Error en la operación")
      }
    } catch {
      toast.error("Error inesperado")
    }
  }

  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2MB")
      return
    }

    setUploadingIndex(index)
    const toastId = toast.loading("Subiendo imagen...")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tenantId", tenantId)

      const result = await uploadProductImage(formData)

      if (!result.success || !result.url) {
        toast.error(result.error || "Error al subir imagen", { id: toastId })
        return
      }

      addImageUrlAtIndex(result.url, index)
      toast.success("Imagen subida con éxito", { id: toastId })
    } catch {
      toast.error("Error al subir imagen", { id: toastId })
    } finally {
      setUploadingIndex(null)
    }
  }

  const addImageUrlAtIndex = (url: string, index: number) => {
    const current = [...(form.getValues("image_urls") || [])]
    current[index] = url
    form.setValue("image_urls", current.filter(Boolean))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl overflow-hidden p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black text-violet-600">
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los detalles de tu producto." : "Configura el catálogo, categorías e imágenes de tu sucursal."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none h-full">General</TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none h-full">
                  Fotos ({form.watch("image_urls")?.length || 0}/{maxImages})
                </TabsTrigger>
                <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-violet-500 rounded-none h-full">Categoría</TabsTrigger>
              </TabsList>
              
              <div className="p-6 pt-4 max-h-[50vh] overflow-y-auto">
                <TabsContent value="general" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Nombre del producto</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Hamburguesa de la Casa" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Precio (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Descripción</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe tu producto…" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormDescription className="flex items-center gap-1">
                          Pronto botón de IA 🤖
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                 <TabsContent value="media" className="space-y-4 mt-0">
                  <div className={`grid gap-4 ${maxImages === 1 ? "grid-cols-1 max-w-[200px] mx-auto" : "grid-cols-3"}`}>
                    {Array.from({ length: maxImages }).map((_, i) => {
                      const urls = form.watch("image_urls")
                      const url = urls ? urls[i] : null
                      return (
                        <div 
                          key={i} 
                          className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative group bg-muted/30 overflow-hidden hover:border-violet-400 transition-colors"
                        >
                          {url ? (
                            <>
                              <Image src={url} alt="Producto" fill className="object-cover rounded-xl" />
                              <button 
                                type="button"
                                aria-label="Eliminar foto"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const current = [...(form.getValues("image_urls") || [])]
                                  current.splice(i, 1)
                                  form.setValue("image_urls", current)
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          ) : uploadingIndex === i ? (
                            <div className="flex flex-col items-center gap-2">
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                              <span className="text-[9px] text-muted-foreground font-bold uppercase">Subiendo...</span>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleFileChange(e, i)}
                              />
                              <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                              <span className="text-[10px] text-muted-foreground group-hover:text-violet-550 transition-colors font-bold uppercase">Subir Foto {i+1}</span>
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="category" className="space-y-4 mt-0">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Seleccionar Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Elige una categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <label htmlFor="new-category-input" className="text-xs font-black uppercase text-muted-foreground block">O crear una nueva</label>
                    <div className="flex gap-2">
                      <Input 
                        id="new-category-input"
                        aria-label="Nombre de la nueva categoría"
                        placeholder="Nueva categoría…" 
                        className="rounded-xl flex-1" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <Button type="button" variant="outline" className="rounded-xl" onClick={handleCreateCategory}>
                        Crear
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 pt-0">
              <Button type="submit" className="w-full rounded-xl font-bold py-6 bg-violet-600 hover:bg-violet-700 shadow-md" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando…" : isEditing ? "Actualizar Producto" : "Finalizar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
