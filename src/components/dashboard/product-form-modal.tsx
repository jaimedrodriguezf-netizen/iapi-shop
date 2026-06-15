"use client"

import * as React from "react"
import { ImagePlus, Trash2, Sparkles, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createProduct, updateProduct, getCategories, createCategory, uploadProductImage } from "@/lib/products/actions"
import { generateProductDescription } from "@/lib/ai/actions"
import Image from "next/image"

const baseProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Ingresa un precio válido.",
  }),
  compare_at_price: z.string().optional(),
  category_id: z.string().optional(),
  description: z.string().optional(),
  image_urls: z.array(z.string()),
})

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
}

interface ProductFormModalProps {
  tenantId: string
  planName?: string
  platformRole?: string
  product: {
    id: string;
    name: string;
    price: number;
    compare_at_price?: number | null;
    category_id?: string;
    description?: string;
    image_urls?: string[];
  } | null // null significa crear
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductFormModal({ tenantId, planName = "starter", platformRole = "merchant", product, open, onOpenChange, onSuccess }: ProductFormModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [newCategoryParentId, setNewCategoryParentId] = React.useState<string>("none")
  const [selectedLevel1Id, setSelectedLevel1Id] = React.useState<string>("")
  const [selectedLevel2Id, setSelectedLevel2Id] = React.useState<string>("")
  const [selectedLevel3Id, setSelectedLevel3Id] = React.useState<string>("")
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false)
  const hasInitializedRef = React.useRef(false)

  const level1Categories = React.useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  const level2Categories = React.useMemo(() => {
    return selectedLevel1Id ? categories.filter(c => c.parent_id === selectedLevel1Id) : [];
  }, [categories, selectedLevel1Id]);

  const level3Categories = React.useMemo(() => {
    return selectedLevel2Id ? categories.filter(c => c.parent_id === selectedLevel2Id) : [];
  }, [categories, selectedLevel2Id]);

  const eligibleParents = React.useMemo(() => {
    return categories.filter(c => {
      if (!c.parent_id) return true;
      const parent = categories.find(p => p.id === c.parent_id);
      if (parent && !parent.parent_id) return true;
      return false;
    });
  }, [categories]);

  const eligibleParentsForRole = React.useMemo(() => {
    return eligibleParents;
  }, [eligibleParents]);

  const isEditing = !!product

  const maxImages = React.useMemo(() => {
    const plan = planName.toLowerCase()
    if (plan === "plus") return 6
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
      compare_at_price: "",
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
    if (open && categories.length > 0 && !hasInitializedRef.current) {
      if (product && product.category_id) {
        const leafCategory = categories.find(c => c.id === product.category_id);
        if (leafCategory) {
          hasInitializedRef.current = true;
          if (leafCategory.parent_id) {
            const parentCategory = categories.find(c => c.id === leafCategory.parent_id);
            if (parentCategory && parentCategory.parent_id) {
              setSelectedLevel1Id(parentCategory.parent_id);
              setSelectedLevel2Id(leafCategory.parent_id);
              setSelectedLevel3Id(product.category_id);
            } else {
              setSelectedLevel1Id(leafCategory.parent_id);
              setSelectedLevel2Id(product.category_id);
              setSelectedLevel3Id("");
            }
          } else {
            setSelectedLevel1Id(product.category_id);
            setSelectedLevel2Id("");
            setSelectedLevel3Id("");
          }
        }
      } else {
        hasInitializedRef.current = true;
        setSelectedLevel1Id("");
        setSelectedLevel2Id("");
        setSelectedLevel3Id("");
      }
    }
  }, [open, categories, product]);

  React.useEffect(() => {
    if (open) {
      hasInitializedRef.current = false
      loadCategories()
      if (product) {
        form.reset({
          name: product.name,
          price: product.price.toString(),
          compare_at_price: product.compare_at_price?.toString() || "",
          category_id: product.category_id || "",
          description: product.description || "",
          image_urls: product.image_urls || [],
        })
      } else {
        form.reset({
          name: "",
          price: "0",
          compare_at_price: "",
          category_id: "",
          description: "",
          image_urls: [],
        })
        setSelectedLevel1Id("")
        setSelectedLevel2Id("")
        setSelectedLevel3Id("")
      }
    }
  }, [open, loadCategories, product, form])

  async function handleCreateCategory() {
    if (!newCategoryName) return
    const isFree = planName.toLowerCase() === "free"
    if (isFree) {
      toast.error("El plan gratis no permite crear categorías")
      return
    }

    const parentId = newCategoryParentId === "none" ? null : newCategoryParentId

    const res = await createCategory(tenantId, newCategoryName, parentId)
    if (res.success) {
      toast.success("Categoría creada")
      setNewCategoryName("")
      setNewCategoryParentId("none")
      loadCategories()
    } else {
      toast.error(res.error || "No se pudo crear la categoría")
    }
  }

  async function handleGenerateDescription() {
    if (planName.toLowerCase() === "free") {
      toast.error("El plan gratis no incluye generación con IA")
      return
    }

    const productName = form.getValues("name")
    if (!productName || productName.length < 2) {
      toast.error("Escribe un nombre de producto primero (mínimo 2 caracteres)")
      return
    }

    const selectedCategoryId = form.getValues("category_id")
    const categoryObj = categories.find(c => c.id === selectedCategoryId)
    const categoryName = categoryObj?.name

    setIsGeneratingAI(true)
    try {
      const result = await generateProductDescription(productName, categoryName)
      if (result.success && result.description) {
        form.setValue("description", result.description)
        toast.success("Descripción generada con IA")
      } else {
        toast.error(result.error || "No se pudo generar la descripción")
      }
    } catch {
      toast.error("Error al conectar con la IA")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  async function onSubmit(values: z.infer<typeof baseProductSchema>) {
    try {
      const compareAtPrice = values.compare_at_price && values.compare_at_price.trim() !== "" 
        ? Number(values.compare_at_price) 
        : null;

      const payload = {
        tenant_id: tenantId,
        category_id: values.category_id,
        name: values.name,
        description: values.description,
        price: Number(values.price),
        compare_at_price: compareAtPrice,
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
          <DialogTitle className="text-2xl font-black text-orange-500">
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
                <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none h-full">General</TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none h-full">
                  Fotos ({form.watch("image_urls")?.length || 0}/{maxImages})
                </TabsTrigger>
                <TabsTrigger value="category" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none h-full">Categoría</TabsTrigger>
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
                    name="compare_at_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Precio original (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="Mayor al precio actual para mostrar descuento" 
                            {...field} 
                            value={field.value ?? ""}
                            className="rounded-xl" 
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Dejalo vacío si no hay descuento. Debe ser mayor al precio actual.
                        </FormDescription>
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
                          <Textarea placeholder="Describe tu producto…" {...field} className="rounded-xl min-h-24 resize-none" value={field.value ?? ""} />
                        </FormControl>
                        <div className="flex items-center gap-2">
                          {planName.toLowerCase() !== "free" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-orange-500 border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                              onClick={handleGenerateDescription}
                              disabled={isGeneratingAI || !form.watch("name") || form.watch("name").length < 2}
                            >
                              {isGeneratingAI ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="mr-1 h-3 w-3" />
                              )}
                              {isGeneratingAI ? "Generando…" : "Generar con IA"}
                            </Button>
                          )}
                          <FormDescription className="mt-0">
                            {planName.toLowerCase() === "free" 
                              ? "Describe tu producto" 
                              : "Describe tu producto o genera una descripción con IA"}
                          </FormDescription>
                        </div>
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
                          className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative group bg-muted/30 overflow-hidden hover:border-orange-400 transition-colors"
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
                              <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
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
                              <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                              <span className="text-[10px] text-muted-foreground group-hover:text-orange-550 transition-colors font-bold uppercase">Subir Foto {i+1}</span>
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="category" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    {/* Level 1: Category */}
                    <div className="space-y-2">
                      <FormLabel className="font-bold">Categoría Principal</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          const value = val === "none" ? "" : (val || "");
                          setSelectedLevel1Id(value);
                          setSelectedLevel2Id("");
                          setSelectedLevel3Id("");
                          form.setValue("category_id", value);
                        }} 
                        value={selectedLevel1Id || "none"}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Elige una categoría principal">
                            {selectedLevel1Id === "" || selectedLevel1Id === "none" ? "Sin categoría" : categories.find(c => c.id === selectedLevel1Id)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">Sin categoría</SelectItem>
                          {level1Categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level 2: Subcategory */}
                    {selectedLevel1Id && selectedLevel1Id !== "none" && level2Categories.length > 0 && (
                      <div className="space-y-2">
                        <FormLabel className="font-bold">Subcategoría</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            const value = val || "";
                            setSelectedLevel2Id(value);
                            setSelectedLevel3Id("");
                            form.setValue("category_id", value === "none" ? selectedLevel1Id : value);
                          }} 
                          value={selectedLevel2Id}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Elige una subcategoría (opcional)">
                              {selectedLevel2Id === "none" ? "Ninguna subcategoría" : categories.find(c => c.id === selectedLevel2Id)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">Ninguna subcategoría</SelectItem>
                            {level2Categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Level 3: Third Level */}
                    {selectedLevel2Id && selectedLevel2Id !== "none" && level3Categories.length > 0 && (
                      <div className="space-y-2">
                        <FormLabel className="font-bold">Tercera Categoría</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            const value = val || "";
                            setSelectedLevel3Id(value);
                            form.setValue("category_id", value === "none" ? selectedLevel2Id : value);
                          }} 
                          value={selectedLevel3Id}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Elige una tercera categoría (opcional)">
                              {selectedLevel3Id === "none" ? "Ninguna tercera categoría" : categories.find(c => c.id === selectedLevel3Id)?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">Ninguna tercera categoría</SelectItem>
                            {level3Categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {planName.toLowerCase() !== "free" && (
                    <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                      <label htmlFor="new-category-input" className="text-xs font-black uppercase text-muted-foreground block" id="parent-category-label">
                        ¿Depende de otra categoría? (Opcional)
                      </label>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                            Categoría Padre (Opcional)
                          </span>
                          <Select 
                            onValueChange={(val) => setNewCategoryParentId(val || "none")} 
                            value={newCategoryParentId}
                          >
                            <SelectTrigger className="rounded-xl h-9" aria-labelledby="parent-category-label">
                              <SelectValue placeholder="Ninguna (Categoría Principal)">
                                {(() => {
                                  if (newCategoryParentId === "none") return "Ninguna (Categoría Principal)";
                                  const c = categories.find(cat => cat.id === newCategoryParentId);
                                  if (!c) return undefined;
                                  const parent = c.parent_id ? categories.find(p => p.id === c.parent_id) : null;
                                  return parent ? `Subcategoría > ${parent.name} > ${c.name}` : `Principal > ${c.name}`;
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="none">Ninguna (Categoría Principal)</SelectItem>
                              {eligibleParentsForRole.map((c) => {
                                const parent = c.parent_id ? categories.find(p => p.id === c.parent_id) : null;
                                const prefix = parent ? `Subcategoría > ${parent.name} > ` : "Principal > ";
                                return (
                                  <SelectItem key={c.id} value={c.id}>
                                    {prefix}{c.name}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2">
                          <Input 
                            id="new-category-input"
                            aria-label="Nombre de la nueva categoría"
                            placeholder="Nombre de la nueva categoría…" 
                            className="rounded-xl flex-1" 
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="rounded-xl font-bold" 
                            onClick={handleCreateCategory}
                          >
                            Crear
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 pt-0">
              <Button type="submit" className="w-full rounded-xl font-bold py-6 bg-orange-500 hover:bg-orange-600 shadow-md" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando…" : isEditing ? "Actualizar Producto" : "Finalizar Producto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
