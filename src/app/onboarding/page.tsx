"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

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
import { createTenant } from "@/lib/tenants/actions"

const countries = [
  { label: "🇪🇨 Ecuador (+593)", value: "+593" },
  { label: "🇨🇴 Colombia (+57)", value: "+57" },
  { label: "🇵🇪 Perú (+51)", value: "+51" },
  { label: "🇦🇷 Argentina (+54)", value: "+54" },
  { label: "🇨🇱 Chile (+56)", value: "+56" },
  { label: "🇲🇽 México (+52)", value: "+52" },
  { label: "🇺🇸 USA (+1)", value: "+1" },
  { label: "🇪🇸 España (+34)", value: "+34" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }).max(120),
  slug: z.string().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "El slug solo puede contener letras minúsculas, números y guiones.",
  }),
  country_code: z.string(),
  phone_number: z.string().regex(/^[0-9\s-]{7,}$/, {
    message: "Ingresa un número de teléfono válido.",
  }),
})

export default function OnboardingPage() {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      country_code: "+593",
      phone_number: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const fullPhone = `${values.country_code}${values.phone_number.replace(/\s+/g, "")}`
      const result = await createTenant({
        name: values.name,
        slug: values.slug,
        whatsapp_phone: fullPhone,
      })
      
      if (result.success) {
        toast.success("¡Sucursal creada con éxito!")
        router.push(`/dashboard`)
      } else {
        toast.error(result.error || "Error al crear la sucursal")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    }
  }

  const watchName = form.watch("name")
  React.useEffect(() => {
    if (watchName && !form.getFieldState("slug").isDirty) {
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "")
      form.setValue("slug", generatedSlug)
    }
  }, [watchName, form])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md rounded-3xl shadow-lg border-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-black">Crea tu sucursal</CardTitle>
          <CardDescription>
            Configura los detalles básicos para empezar a vender.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Nombre de la sucursal</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Sucursal Increíble" {...field} className="rounded-xl" />
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
                    <FormLabel className="font-bold">URL de la sucursal (Slug)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">iapi.shop/</span>
                        <Input placeholder="mi-sucursal" {...field} className="rounded-xl font-medium" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Link público para tus clientes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <FormLabel className="font-bold">WhatsApp de ventas</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem className="w-[140px]">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Código" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl">
                            {countries.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label.split(" ")[0]} {c.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="999999999" {...field} className="rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  Donde recibirás los pedidos por WhatsApp.
                </FormDescription>
              </div>
              <Button type="submit" className="w-full rounded-xl font-bold py-6 bg-orange-500 hover:bg-orange-600 shadow-sm" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creando..." : "Finalizar y empezar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
