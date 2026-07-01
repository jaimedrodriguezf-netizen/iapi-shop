"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Check, MapPin, Palette, Share2, AlertTriangle, Building, Globe, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StorefrontHeader } from "@/components/storefront/storefront-header"
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
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
import {
  updateTenantSettings,
  checkSlugAvailability,
  type Tenant,
  type Address,
  type SocialLinks,
  type ColorPalette,
  type Country,
  type Province,
  type Canton,
  getProvincesByCountryId,
  getCantonsByProvinceId,
} from "@/lib/tenants/actions"
import { cn } from "@/lib/utils"

// WCAG AA contrast check: calculates relative luminance contrast ratio
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hasLowContrast(hex: string): boolean {
  const whiteContrast = getContrastRatio(hex, "#FFFFFF")
  const darkContrast = getContrastRatio(hex, "#000000")
  return whiteContrast < 4.5 && darkContrast < 4.5
}

const brandingSchema = z.object({
  name: z.string().min(2, "El nombre de la tienda debe tener al menos 2 caracteres"),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Formato de slug inválido. Solo minúsculas, números y guiones"),
  status: z.enum(["active", "draft"]),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Formato HEX inválido (ej: #f97316)").or(z.literal("")),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Formato HEX inválido").or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  show_phone: z.boolean(),
  show_address: z.boolean(),
  show_social_links: z.boolean(),
})

function parseAddress(tenant: Tenant): { street: string; city: string; state: string; zip: string; country: string } {
  if (!tenant.address) return { street: "", city: "", state: "", zip: "", country: "" }
  if (typeof tenant.address === "string") {
    const trimmed = tenant.address.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as Address
        return {
          street: parsed.street || "",
          city: parsed.city || "",
          state: parsed.state || "",
          zip: parsed.zip || "",
          country: parsed.country || "",
        }
      } catch (e) {
        // Fall back to treating it as street
      }
    }
    return { street: trimmed, city: "", state: "", zip: "", country: "" }
  }
  const addr = tenant.address as Address
  return {
    street: addr.street || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: addr.zip || "",
    country: addr.country || "",
  }
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_urls?: string[]
  category_id?: string
}

interface SettingsFormProps {
  tenant: Tenant
  initialProducts?: Product[]
  planName?: string
  palettes: ColorPalette[]
  countries?: Country[]
}



export function SettingsForm({ tenant, initialProducts = [], planName = "Free", palettes, countries = [] }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const brandColorInputRef = React.useRef<HTMLInputElement>(null)
  const secondaryColorInputRef = React.useRef<HTMLInputElement>(null)

  const [provinces, setProvinces] = React.useState<Province[]>([])
  const [cantons, setCantons] = React.useState<Canton[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = React.useState(false)
  const [isLoadingCantons, setIsLoadingCantons] = React.useState(false)

  const parsedAddress = parseAddress(tenant)

  const form = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: tenant.name || "",
      slug: tenant.slug || "",
      status: (tenant.status as "active" | "draft") || "draft",
      brand_color: tenant.brand_color || "#f97316",
      secondary_color: tenant.secondary_color || "",
      street: parsedAddress.street,
      city: parsedAddress.city,
      state: parsedAddress.state,
      zip: parsedAddress.zip,
      country: parsedAddress.country,
      instagram: tenant.social_links?.instagram || "",
      facebook: tenant.social_links?.facebook || "",
      tiktok: tenant.social_links?.tiktok || "",
      show_phone: tenant.public_settings?.show_phone !== false,
      show_address: tenant.public_settings?.show_address !== false,
      show_social_links: tenant.public_settings?.show_social_links !== false,
    },
  })

  const currentBrandColor = form.watch("brand_color")
  const currentSecondaryColor = form.watch("secondary_color")
  const watchName = form.watch("name")
  const watchSlug = form.watch("slug")
  const watchCountry = form.watch("country")
  const watchState = form.watch("state")
  const isFreePlan = planName.toLowerCase() === "free"
  const cannotPublish = watchName === "Mi Tienda" || (watchSlug ? watchSlug.startsWith("tienda-") : false)

  const [isGeneratingSlug, setIsGeneratingSlug] = React.useState(false)

  React.useEffect(() => {
    if (watchCountry === "Ecuador") {
      const ecuador = countries.find(c => c.name.toLowerCase() === "ecuador")
      if (ecuador) {
        setIsLoadingProvinces(true)
        getProvincesByCountryId(ecuador.id)
          .then((res) => {
            if (res.success && res.data) {
              setProvinces(res.data)
            }
          })
          .finally(() => setIsLoadingProvinces(false))
      }
    } else {
      setProvinces([])
      setCantons([])
    }
  }, [watchCountry, countries])

  React.useEffect(() => {
    if (watchCountry === "Ecuador" && watchState) {
      const provinceObj = provinces.find(p => p.name.toLowerCase() === watchState.toLowerCase())
      if (provinceObj) {
        setIsLoadingCantons(true)
        getCantonsByProvinceId(provinceObj.id)
          .then((res) => {
            if (res.success && res.data) {
              setCantons(res.data)
            }
          })
          .finally(() => setIsLoadingCantons(false))
      } else {
        setCantons([])
      }
    } else {
      setCantons([])
    }
  }, [watchCountry, watchState, provinces])

  const generateAndCheckSlug = async () => {
    const storeName = form.getValues("name")
    if (!storeName || storeName === "Mi Tienda") {
      toast.error("Por favor, ingresa un nombre personalizado para tu tienda primero.")
      return
    }

    const baseSlug = storeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except space/hyphen
      .trim()
      .replace(/[\s-]+/g, "-") // Replace spaces/hyphens with single hyphen

    if (baseSlug.length < 2) {
      toast.error("El nombre de la tienda es demasiado corto para generar un slug válido.")
      return
    }

    setIsGeneratingSlug(true)
    let checkVal = baseSlug
    let count = 0
    let isAvailable = false

    while (count < 10) {
      const candidate = count === 0 ? baseSlug : `${baseSlug}-${count}`
      if (candidate === tenant.slug) {
        checkVal = candidate
        isAvailable = true
        break
      }
      
      const res = await checkSlugAvailability(candidate)
      if (res.available) {
        checkVal = candidate
        isAvailable = true
        break
      }
      count++
    }

    setIsGeneratingSlug(false)
    if (isAvailable) {
      form.setValue("slug", checkVal, { shouldValidate: true })
      toast.success(`Slug sugerido y disponible: ${checkVal}`)
    } else {
      toast.error("No se pudo generar un slug único disponible. Escribe uno manualmente.")
    }
  }

  React.useEffect(() => {
    if (cannotPublish && form.getValues("status") === "active") {
      form.setValue("status", "draft")
    }
  }, [cannotPublish, form])

  async function onSubmit(values: z.infer<typeof brandingSchema>) {
    setIsSubmitting(true)
    try {
      const addressValue = (values.street || values.city || values.state || values.zip || values.country)
        ? { street: values.street, city: values.city, state: values.state, zip: values.zip, country: values.country }
        : null

      const socialLinksValue = (values.instagram || values.facebook || values.tiktok)
        ? { instagram: values.instagram, facebook: values.facebook, tiktok: values.tiktok }
        : null

      const result = await updateTenantSettings(tenant.id, {
        name: values.name,
        slug: values.slug,
        status: values.status,
        brand_color: values.brand_color || null,
        secondary_color: values.secondary_color || null,
        address: addressValue as Address | null,
        social_links: socialLinksValue as SocialLinks | null,
        public_settings: {
          show_phone: values.show_phone,
          show_address: values.show_address,
          show_social_links: values.show_social_links,
        },
      })

      if (result.success) {
        toast.success("Configuración actualizada correctamente")
      } else {
        toast.error(result.error || "Error al actualizar")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const showContrastWarning = currentBrandColor && currentBrandColor !== "" && /^#[0-9A-F]{6}$/i.test(currentBrandColor) && hasLowContrast(currentBrandColor)

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Ajustes Generales</span>
                </div>
                <CardTitle className="text-2xl font-black">Información de la Tienda</CardTitle>
                <CardDescription>
                  Configura el nombre público de tu negocio, su dirección web y el estado de publicación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="store-name" className="font-bold">Nombre de la Tienda</FormLabel>
                      <FormControl>
                        <Input id="store-name" placeholder="Mi Tienda Hermosa" {...field} className="rounded-xl h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="store-slug" className="font-bold">Dirección Web (slug)</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm font-medium shrink-0">iapi.shop/</span>
                            <Input id="store-slug" placeholder="mi-tienda" {...field} className="rounded-xl h-12 flex-1" />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={generateAndCheckSlug}
                              disabled={isGeneratingSlug}
                              className="rounded-xl h-12 shrink-0 border-orange-200 hover:bg-orange-50 font-bold text-orange-700 transition-all active:scale-95 shadow-sm"
                            >
                              {isGeneratingSlug ? "Verificando..." : "Sugerir Slug"}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel htmlFor="status-toggle" className="font-bold">Publicar Tienda</FormLabel>
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <label
                            htmlFor="status-toggle"
                            className={cn(
                              "relative inline-flex items-center",
                              cannotPublish ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            )}
                          >
                            <input
                              type="checkbox"
                              id="status-toggle"
                              aria-label="Publicar Tienda"
                              className="sr-only peer"
                              checked={field.value === "active"}
                              disabled={cannotPublish}
                              onChange={(e) => field.onChange(e.target.checked ? "active" : "draft")}
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-orange-500"></div>
                            <span className="ml-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                              {field.value === "active" ? "Pública (Activa)" : "Borrador (Construcción)"}
                            </span>
                          </label>
                        </FormControl>
                      </div>
                      {isFreePlan && (
                        <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-xl mt-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            En el <strong>Plan Free</strong> puedes publicar tu tienda, pero con un límite máximo de <strong>15 productos visibles</strong>.
                          </span>
                        </div>
                      )}
                      {cannotPublish && (
                        <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-xl mt-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            Para publicar tu tienda, primero debes cambiar el nombre por defecto &apos;Mi Tienda&apos; y configurar un slug personalizado que no empiece con &apos;tienda-&apos;.
                          </span>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <Palette className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Identidad Visual</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-black">Colores de Marca</CardTitle>
                <CardDescription>
                  Personaliza los colores que verán tus clientes en el catálogo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-3">
                  <FormLabel className="font-bold text-sm">Paletas de Colores Sugeridas</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {palettes.map((palette) => {
                      const isSelected = form.watch("brand_color") === palette.brand_color && 
                                         form.watch("secondary_color") === palette.secondary_color;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          className={cn(
                            "h-14 w-28 rounded-2xl border-4 transition-all duration-300 relative flex items-center justify-between shadow-sm overflow-hidden p-0",
                            isSelected
                              ? "scale-110 shadow-md rotate-3 border-orange-600"
                              : "border-zinc-200 dark:border-zinc-800 hover:scale-105 hover:shadow-md hover:rotate-[-2deg]"
                          )}
                          style={{
                            borderColor: isSelected ? "var(--brand-color)" : "transparent"
                          }}
                          onClick={() => {
                            form.setValue("brand_color", palette.brand_color, { shouldValidate: true });
                            form.setValue("secondary_color", palette.secondary_color, { shouldValidate: true });
                          }}
                          title={palette.name}
                        >
                          {/* Split Colors */}
                          <div className="h-full w-1/2" style={{ backgroundColor: palette.brand_color }} />
                          <div className="h-full w-1/2" style={{ backgroundColor: palette.secondary_color }} />
                          
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                            <span className="text-[10px] font-black text-white drop-shadow-md tracking-wider uppercase">{palette.name}</span>
                          </div>
                          
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20">
                              <Check className="h-5 w-5 text-white stroke-[3.5px] drop-shadow-sm animate-in zoom-in-50 duration-200" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="brand_color"
                    render={({ field }) => {
                      return (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-bold">Color Primario Personalizado</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                ref={brandColorInputRef}
                                className="sr-only"
                                value={field.value || "#f97316"}
                                onChange={(e) => field.onChange(e.target.value)}
                                aria-label="Selector de Color Primario"
                              />
                              <button
                                type="button"
                                onClick={() => brandColorInputRef.current?.click()}
                                className={cn(
                                  "h-12 w-12 rounded-2xl border-4 transition-all duration-300 relative flex items-center justify-center shadow-sm overflow-hidden shrink-0",
                                  !palettes.some(p => p.brand_color === field.value) && field.value
                                    ? "scale-110 shadow-md rotate-3"
                                    : "border-zinc-200 dark:border-zinc-800 hover:scale-105 hover:shadow-md hover:rotate-[-2deg]"
                                )}
                                style={{
                                  borderColor: !palettes.some(p => p.brand_color === field.value) && field.value ? "var(--brand-color)" : "transparent"
                                }}
                                title="Color Primario Personalizado"
                              >
                                <div 
                                  className="absolute inset-0 transition-all duration-300"
                                  style={{
                                    background: field.value || "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)"
                                  }}
                                />
                                {field.value && (
                                  <Check className="h-5 w-5 text-white stroke-[3.5px] drop-shadow-sm relative z-10 animate-in zoom-in-50 duration-200" />
                                )}
                              </button>
                              <Input 
                                {...field} 
                                aria-label="Hex Color Primario"
                                className="w-full font-mono uppercase rounded-xl h-12"
                                placeholder="#HEX"
                              />
                            </div>
                          </FormControl>
                          {showContrastWarning && (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-xl">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              Este color tiene bajo contraste. Puede ser difícil de leer sobre fondos claros u oscuros.
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="secondary_color"
                    render={({ field }) => {
                      return (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-bold">Color Secundario Personalizado</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                ref={secondaryColorInputRef}
                                className="sr-only"
                                value={field.value || "#bae6fd"}
                                onChange={(e) => field.onChange(e.target.value)}
                                aria-label="Selector de Color Secundario"
                              />
                              <button
                                type="button"
                                onClick={() => secondaryColorInputRef.current?.click()}
                                className={cn(
                                  "h-12 w-12 rounded-2xl border-4 transition-all duration-300 relative flex items-center justify-center shadow-sm overflow-hidden shrink-0",
                                  !palettes.some(p => p.secondary_color === field.value) && field.value
                                    ? "scale-110 shadow-md rotate-3"
                                    : "border-zinc-200 dark:border-zinc-800 hover:scale-105 hover:shadow-md hover:rotate-[-2deg]"
                                )}
                                style={{
                                  borderColor: !palettes.some(p => p.secondary_color === field.value) && field.value ? "var(--brand-color)" : "transparent"
                                }}
                                title="Color Secundario Personalizado"
                              >
                                <div 
                                  className="absolute inset-0 transition-all duration-300"
                                  style={{
                                    background: field.value || "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)"
                                  }}
                                />
                                {field.value && (
                                  <Check className="h-5 w-5 text-white stroke-[3.5px] drop-shadow-sm relative z-10 animate-in zoom-in-50 duration-200" />
                                )}
                              </button>
                              <Input 
                                {...field} 
                                aria-label="Hex Color Secundario"
                                className="w-full font-mono uppercase rounded-xl h-12"
                                placeholder="#HEX"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Building className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Dirección del Negocio</span>
                </div>
                <CardTitle className="text-2xl font-black">Dirección Física</CardTitle>
                <CardDescription>
                  Aparecerá en el pie de página de tu catálogo público.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="address-street" className="font-bold">Calle y Número</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="address-street" placeholder="Av. Amazonas 123" {...field} className="pl-10 rounded-xl h-12" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {watchCountry === "Ecuador" ? (
                    <>
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="address-state" className="text-xs font-black uppercase text-muted-foreground">Provincia</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val)
                                  form.setValue("city", "")
                                  setCantons([])
                                }}
                                value={field.value || ""}
                                disabled={isLoadingProvinces}
                              >
                                <SelectTrigger id="address-state" className="rounded-xl h-12 w-full">
                                  <SelectValue placeholder={isLoadingProvinces ? "Cargando..." : "Elige una provincia"}>
                                    {field.value || "Elige una provincia"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {provinces.map((p) => (
                                    <SelectItem key={p.id} value={p.name}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="address-city" className="text-xs font-black uppercase text-muted-foreground">Cantón</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                                disabled={isLoadingCantons || !watchState}
                              >
                                <SelectTrigger id="address-city" className="rounded-xl h-12 w-full">
                                  <SelectValue placeholder={isLoadingCantons ? "Cargando..." : "Elige un cantón"}>
                                    {field.value || "Elige un cantón"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {cantons.map((c) => (
                                    <SelectItem key={c.id} value={c.name}>
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="address-city" className="text-xs font-black uppercase text-muted-foreground">Ciudad</FormLabel>
                            <FormControl>
                              <Input id="address-city" placeholder="Quito" {...field} className="rounded-xl h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="address-state" className="text-xs font-black uppercase text-muted-foreground">Provincia / Estado</FormLabel>
                            <FormControl>
                              <Input id="address-state" placeholder="Pichincha" {...field} className="rounded-xl h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="address-zip" className="text-xs font-black uppercase text-muted-foreground">Código Postal</FormLabel>
                        <FormControl>
                          <Input id="address-zip" placeholder="170150" {...field} className="rounded-xl h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="address-country" className="text-xs font-black uppercase text-muted-foreground">País</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val)
                                // State cleanup & cascading reset:
                                form.setValue("state", "")
                                form.setValue("city", "")
                                setProvinces([])
                                setCantons([])
                              }}
                              value={field.value || ""}
                            >
                              <SelectTrigger id="address-country" className="pl-10 rounded-xl h-12 w-full">
                                <SelectValue placeholder="Elige un país">
                                  {field.value || "Elige un país"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {countries.map((c) => (
                                  <SelectItem key={c.id} value={c.name}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Contacto y Redes</span>
                </div>
                <CardTitle className="text-2xl font-black">Redes Sociales</CardTitle>
                <CardDescription>
                  Tus clientes podrán encontrar tus perfiles desde el pie de página.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">Instagram</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="https://instagram.com/usuario" {...field} className="pl-10 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">Facebook</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="https://facebook.com/pagina" {...field} className="pl-10 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">TikTok</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="https://tiktok.com/@usuario" {...field} className="pl-10 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-orange-500 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Privacidad en Catálogo</span>
                </div>
                <CardTitle className="text-2xl font-black">Privacidad en Catálogo</CardTitle>
                <CardDescription>
                  Elige qué información de contacto y enlaces de redes sociales se muestran públicamente en tu tienda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="show_phone"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-zinc-50 dark:bg-zinc-900/50">
                      <div className="space-y-0.5">
                        <FormLabel className="font-bold">Mostrar WhatsApp en Catálogo</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Permite a tus clientes ver el botón de WhatsApp para contactarte.
                        </div>
                      </div>
                      <FormControl>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            id="show-phone-toggle"
                            aria-label="Mostrar WhatsApp en Catálogo"
                            className="sr-only peer"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-orange-500"></div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_address"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-zinc-50 dark:bg-zinc-900/50">
                      <div className="space-y-0.5">
                        <FormLabel className="font-bold">Mostrar Dirección Física</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Muestra la dirección de tu negocio en el catálogo.
                        </div>
                      </div>
                      <FormControl>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            id="show-address-toggle"
                            aria-label="Mostrar Dirección Física"
                            className="sr-only peer"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-orange-500"></div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_social_links"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-zinc-50 dark:bg-zinc-900/50">
                      <div className="space-y-0.5">
                        <FormLabel className="font-bold">Mostrar Redes Sociales</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Muestra los enlaces a tus perfiles de redes sociales en el catálogo.
                        </div>
                      </div>
                      <FormControl>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            id="show-social-toggle"
                            aria-label="Mostrar Redes Sociales"
                            className="sr-only peer"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-orange-500"></div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full lg:w-fit rounded-xl font-black px-12 py-7 bg-orange-500 hover:bg-orange-600 text-lg shadow-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="sticky top-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Check className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Vista Previa en Vivo</span>
          </div>
          
          {/* Live Phone Preview container rendering the actual storefront layout */}
          <div 
            className="rounded-[40px] border-8 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black aspect-[9/19] h-[640px] shadow-2xl overflow-hidden relative select-none"
            style={{
              "--brand-color": currentBrandColor || "#f97316",
              "--secondary-color": currentSecondaryColor || "#bae6fd",
            } as React.CSSProperties}
          >
            <div className="h-full w-full overflow-y-auto no-scrollbar pb-24 bg-zinc-50 dark:bg-black text-left">
              {/* 1. Header component populated with dynamic form values */}
              <StorefrontHeader 
                tenantName={watchName || tenant.name || "Mi Tienda"}
                tenantId={tenant.id}
                brandColor={currentBrandColor || "#f97316"}
              />
              
              <StorefrontCatalog
                categories={[]}
                products={initialProducts}
                tenantId={tenant.id}
                brandColor={currentBrandColor || "#f97316"}
                secondaryColor={currentSecondaryColor || "#bae6fd"}
                whatsappPhone={tenant.whatsapp_phone || ""}
                favoriteIds={[]}
                onToggleFavorite={() => {}}
                isAuthenticated={false}
              />

              {/* 3. Static Footer component */}
              <footer className="bg-white dark:bg-zinc-900 border-t py-6 px-4 text-center mt-6">
                <p className="text-[10px] text-muted-foreground font-medium">
                  © {new Date().getFullYear()} {watchName || tenant.name || "Mi Tienda"}.
                </p>
                <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-70">
                  Potenciado por Tenddy Shop
                </div>
              </footer>
            </div>

            {/* Absolute Floating Shopping Bag visual mock */}
            <div 
              className="absolute bottom-6 right-6 h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center text-white cursor-default select-none transition-all duration-300" 
              style={{ backgroundColor: currentBrandColor || "#f97316" }}
            >
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
          
          <p className="text-center text-[10px] text-muted-foreground mt-4 italic">
            Así es como tus clientes verán el catálogo en su celular. Es completamente interactiva.
          </p>
        </div>
      </div>
    </div>
  )
}
