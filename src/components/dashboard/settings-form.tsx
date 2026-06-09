"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Check, MapPin, Palette, Share2, AlertTriangle, Building, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { updateTenantSettings, type Tenant, type Address, type SocialLinks } from "@/lib/tenants/actions"
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
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, "Formato HEX inválido (ej: #7c3aed)").or(z.literal("")),
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

const PRESET_COLORS = [
  { name: "IAPI Violet", value: "#7c3aed" },
  { name: "Ocean Blue", value: "#0284c7" },
  { name: "Emerald", value: "#059669" },
  { name: "Royal Purple", value: "#6d28d9" },
  { name: "Rose", value: "#e11d48" },
  { name: "Slate", value: "#475569" },
]

function parseAddress(tenant: Tenant): { street: string; city: string; state: string; zip: string; country: string } {
  if (!tenant.address) return { street: "", city: "", state: "", zip: "", country: "" }
  if (typeof tenant.address === "string") {
    return { street: tenant.address, city: "", state: "", zip: "", country: "" }
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

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const parsedAddress = parseAddress(tenant)

  const form = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: tenant.name || "",
      slug: tenant.slug || "",
      status: (tenant.status as "active" | "draft") || "draft",
      brand_color: tenant.brand_color || "#7c3aed",
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
  const watchName = form.watch("name")
  const watchSlug = form.watch("slug")
  const cannotPublish = watchName === "Mi Tienda" || (watchSlug ? watchSlug.startsWith("tienda-") : false)

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
                <div className="flex items-center gap-2 text-violet-600 mb-2">
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
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-medium">iapi.shop/</span>
                          <Input id="store-slug" placeholder="mi-tienda" {...field} className="rounded-xl h-12" />
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
                          <div className="relative inline-flex items-center">
                            <input
                              type="checkbox"
                              id="status-toggle"
                              aria-label="Publicar Tienda"
                              className="sr-only peer"
                              checked={field.value === "active"}
                              disabled={cannotPublish}
                              onChange={(e) => field.onChange(e.target.checked ? "active" : "draft")}
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
                            <span className="ml-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                              {field.value === "active" ? "Pública (Activa)" : "Borrador (Construcción)"}
                            </span>
                          </div>
                        </FormControl>
                      </div>
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
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                  <Palette className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Identidad Visual</span>
                </div>
                <CardTitle className="text-2xl font-black">Colores de Marca</CardTitle>
                <CardDescription>
                  Personaliza el color principal que verán tus clientes en el catálogo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="brand_color"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="font-bold">Color Primario</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-3">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={cn(
                                "h-12 w-12 rounded-xl border-4 transition-all relative flex items-center justify-center",
                                field.value === color.value ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: color.value }}
                              onClick={() => field.onChange(color.value)}
                              title={color.name}
                            >
                              {field.value === color.value && <Check className="h-6 w-6 text-white drop-shadow-md" />}
                            </button>
                          ))}
                          <div className="flex items-center gap-2 ml-2">
                            <Input 
                              {...field} 
                              className="w-28 font-mono uppercase rounded-xl h-12"
                              placeholder="#HEX"
                            />
                          </div>
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
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-violet-600 mb-2">
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
                      <FormLabel className="font-bold">Calle y Número</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Av. Amazonas 123" {...field} className="pl-10 rounded-xl h-12" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">Ciudad</FormLabel>
                        <FormControl>
                          <Input placeholder="Quito" {...field} className="rounded-xl" />
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
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">Provincia / Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Pichincha" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="170150" {...field} className="rounded-xl" />
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
                        <FormLabel className="text-xs font-black uppercase text-muted-foreground">País</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Ecuador" {...field} className="pl-10 rounded-xl" />
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
                <div className="flex items-center gap-2 text-violet-600 mb-2">
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
                <div className="flex items-center gap-2 text-violet-600 mb-2">
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
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
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
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
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
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-violet-600"></div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full lg:w-fit rounded-xl font-black px-12 py-7 bg-violet-600 hover:bg-violet-700 text-lg shadow-xl"
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
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600">Vista Previa en Vivo</span>
          </div>
          <div className="rounded-[40px] border-8 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black p-4 aspect-[9/19] shadow-2xl overflow-hidden pointer-events-none select-none relative">
            <div className="h-20 w-full rounded-b-2xl bg-white dark:bg-zinc-900 border-b flex flex-col items-center justify-center p-4">
               <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
               <div className="h-3 w-20 bg-muted rounded-full mt-2 animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
               <div className="h-4 w-2/3 bg-muted rounded-full animate-pulse" />
               <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-square bg-white dark:bg-zinc-900 rounded-xl border p-2 flex flex-col justify-end gap-2">
                       <div className="h-2 w-full bg-muted rounded-full" />
                       <div className="flex justify-between items-center">
                          <div className="h-3 w-10 rounded-full" style={{ backgroundColor: currentBrandColor }} />
                          <div className="h-6 w-6 rounded-lg" style={{ backgroundColor: currentBrandColor }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="absolute bottom-6 right-6 h-12 w-12 rounded-xl shadow-xl flex items-center justify-center text-white" style={{ backgroundColor: currentBrandColor }}>
               <Check className="h-6 w-6" />
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 italic">
            Así es como tus clientes verán el catálogo en su celular.
          </p>
        </div>
      </div>
    </div>
  )
}
