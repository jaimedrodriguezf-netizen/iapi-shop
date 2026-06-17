"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Check, Loader2, X } from "lucide-react"
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
import { createTenant, checkSlugAvailability, getMyTenants, getTenantSubscription } from "@/lib/tenants/actions"
import { useDebounce } from "@/hooks/use-debounce"
import { ConsentCheckbox } from "@/components/legal/consent-checkbox"

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
  }).optional().or(z.literal("")),
  accepted_legal_terms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos y condiciones y la política de privacidad." }),
  }),
})

type SlugAvailability = {
  status: "idle" | "checking" | "available" | "taken" | "error";
  message?: string;
}

export default function OnboardingPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [canCreateStore, setCanCreateStore] = React.useState(true)
  const [limitMessage, setLimitMessage] = React.useState("")
  const [slugAvailability, setSlugAvailability] = React.useState<SlugAvailability>({
    status: "idle",
  })

  React.useEffect(() => {
    async function checkExisting() {
      const tenantsResult = await getMyTenants()
      if (tenantsResult.success && tenantsResult.data && tenantsResult.data.length > 0) {
        // Check if any tenant has plus plan
        const subChecks = await Promise.all(
          tenantsResult.data.map(t => getTenantSubscription(t.id))
        )
        const hasPlus = subChecks.some(
          s => s.success && s.data?.plans?.name?.toLowerCase() === "plus"
        )
        if (!hasPlus) {
          setCanCreateStore(false)
          setLimitMessage("Tu plan actual solo permite 1 sucursal. Actualizá a Plus para crear más.")
        }
      }
    }
    checkExisting()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      country_code: "+593",
      phone_number: "",
      accepted_legal_terms: false as unknown as true,
    },
  })

  const watchName = form.watch("name")
  const watchSlug = form.watch("slug")
  const debouncedSlug = useDebounce(watchSlug, 400)
  const slugErrors = form.formState.errors.slug

  React.useEffect(() => {
    if (watchName && !form.getFieldState("slug").isDirty) {
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "")
      form.setValue("slug", generatedSlug)
    }
  }, [watchName, form])

  React.useEffect(() => {
    if (!debouncedSlug || debouncedSlug.length < 2 || slugErrors) {
      setSlugAvailability({ status: "idle" })
      return
    }

    let cancelled = false

    async function checkAvailability() {
      setSlugAvailability({ status: "checking" })
      const result = await checkSlugAvailability(debouncedSlug)

      if (cancelled) return

      if (result.error) {
        if (result.error === "No autorizado") {
          setSlugAvailability({ status: "error", message: result.error })
        } else {
          // Format validation error — slug is invalid, not "taken"
          setSlugAvailability({ status: "idle" })
        }
        return
      }

      if (result.available) {
        setSlugAvailability({
          status: "available",
          message: "Disponible",
        })
      } else {
        setSlugAvailability({
          status: "taken",
          message: "Ya está en uso",
        })
      }
    }

    checkAvailability()

    return () => {
      cancelled = true
    }
  }, [debouncedSlug, slugErrors])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const fullPhone = values.phone_number 
        ? `${values.country_code}${values.phone_number.replace(/\s+/g, "")}`
        : undefined
      const result = await createTenant({
        name: values.name,
        slug: values.slug,
        whatsapp_phone: fullPhone,
        accepted_legal_terms: values.accepted_legal_terms,
      })

      if (result.success && result.data) {
        toast.success("¡Sucursal creada con éxito!")
        router.push(`/dashboard/${result.data.slug}`)
      } else {
        toast.error(result.error || "Error al crear la sucursal")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = isSubmitting || slugAvailability.status === "taken" || slugAvailability.status === "checking"

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
          {!canCreateStore && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm font-medium mb-4">
              {limitMessage}
            </div>
          )}
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
                        <span className="text-sm font-bold text-orange-500 bg-orange-50 px-3 py-2 rounded-lg">iapi.shop/</span>
                        <div className="relative flex-1">
                          <Input
                            placeholder="mi-sucursal"
                            {...field}
                            className="rounded-xl font-medium pr-8"
                          />
                          {slugAvailability.status === "available" && (
                            <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                          )}
                          {slugAvailability.status === "taken" && (
                            <X className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                          )}
                          {slugAvailability.status === "checking" && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    {slugAvailability.status === "available" && (
                      <p className="text-sm text-green-600 font-medium">{slugAvailability.message}</p>
                    )}
                    {slugAvailability.status === "taken" && (
                      <p className="text-sm text-red-500 font-medium">{slugAvailability.message}</p>
                    )}
                    {slugAvailability.status === "checking" && (
                      <p className="text-sm text-muted-foreground">Verificando disponibilidad...</p>
                    )}
                    {slugAvailability.status === "idle" && (
                      <FormDescription>
                        Link público para tus clientes.
                      </FormDescription>
                    )}
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
              <FormField
                control={form.control}
                name="accepted_legal_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ConsentCheckbox
                        checked={field.value as boolean}
                        onChange={(checked) => field.onChange(checked)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full rounded-xl font-bold py-6 bg-orange-500 hover:bg-orange-600 shadow-sm"
                disabled={isSubmitDisabled || !canCreateStore}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Finalizar y empezar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}