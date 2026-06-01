"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Check, MapPin, Palette, Share2 } from "lucide-react"

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
import { updateTenantBranding, Tenant } from "@/lib/tenants/actions"
import { cn } from "@/lib/utils"

const brandingSchema = z.object({
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, "HEX inválido"),
  address: z.string().min(5, "La dirección debe ser más descriptiva").optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
})

const PRESET_COLORS = [
  { name: "IAPI Violet", value: "#7c3aed" },
  { name: "Ocean Blue", value: "#0284c7" },
  { name: "Emerald", value: "#059669" },
  { name: "Royal Purple", value: "#6d28d9" },
  { name: "Rose", value: "#e11d48" },
  { name: "Slate", value: "#475569" },
]

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brand_color: tenant.brand_color || "#7c3aed",
      address: tenant.address || "",
      instagram: tenant.social_links?.instagram || "",
      facebook: tenant.social_links?.facebook || "",
      tiktok: tenant.social_links?.tiktok || "",
    },
  })

  async function onSubmit(values: z.infer<typeof brandingSchema>) {
    setIsSubmitting(true)
    try {
      const result = await updateTenantBranding(tenant.id, {
        brand_color: values.brand_color,
        address: values.address,
        social_links: {
          instagram: values.instagram,
          facebook: values.facebook,
          tiktok: values.tiktok,
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

  const currentBrandColor = form.watch("brand_color")

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-sm bg-background">
              <CardHeader>
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                  <Share2 className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Contacto y Redes</span>
                </div>
                <CardTitle className="text-2xl font-black">Información del Negocio</CardTitle>
                <CardDescription>
                  Estos datos aparecerán en el pie de página de tu catálogo público.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Dirección Física</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Av. Amazonas y Eloy Alfaro, Quito" {...field} className="pl-10 rounded-xl h-12" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                            <Input placeholder="@usuario" {...field} className="pl-10 rounded-xl" />
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
                            <Input placeholder="link-a-pagina" {...field} className="pl-10 rounded-xl" />
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
                            <Input placeholder="@usuario" {...field} className="pl-10 rounded-xl" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
