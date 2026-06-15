"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Package, Users, Sparkles, QrCode, Globe, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plan, createPlan, updatePlan, deletePlan } from "@/lib/admin/plan-actions"
import { SaaSUser } from "@/lib/admin/actions"

interface PlansManagerProps {
  plans: Plan[]
  users: SaaSUser[]
}

export function PlansManager({ plans: initialPlans, users }: PlansManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [plans, setPlans] = React.useState(initialPlans)
  const [editing, setEditing] = React.useState<Plan | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // Form state
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [price, setPrice] = React.useState("0")
  const [productLimit, setProductLimit] = React.useState("10")
  const [userLimit, setUserLimit] = React.useState("1")
  const [aiText, setAiText] = React.useState("0")
  const [aiImage, setAiImage] = React.useState("0")
  const [qrAnalytics, setQrAnalytics] = React.useState(false)
  const [customDomain, setCustomDomain] = React.useState(false)
  const [advancedReports, setAdvancedReports] = React.useState(false)

  const openNew = () => {
    setEditing(null)
    setCode("")
    setName("")
    setPrice("0")
    setProductLimit("10")
    setUserLimit("1")
    setAiText("0")
    setAiImage("0")
    setQrAnalytics(false)
    setCustomDomain(false)
    setAdvancedReports(false)
    setDialogOpen(true)
  }

  const openEdit = (p: Plan) => {
    setEditing(p)
    setCode(p.code)
    setName(p.name)
    setPrice(p.price_monthly.toString())
    setProductLimit(p.product_limit.toString())
    setUserLimit(p.user_limit.toString())
    setAiText(p.ai_text_credits.toString())
    setAiImage(p.ai_image_credits.toString())
    setQrAnalytics(p.qr_analytics_enabled)
    setCustomDomain(p.custom_domain_enabled)
    setAdvancedReports(p.advanced_reports_enabled)
    setDialogOpen(true)
  }

  const userCountForPlan = (planName: string) => {
    return users.filter(u => u.tenants.some(t => t.planName === planName)).length
  }

  const handleSave = () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Código y nombre son obligatorios")
      return
    }

    const formData = {
      code: code.trim().toLowerCase().replace(/\s+/g, "_"),
      name: name.trim(),
      price_monthly: Number(price) || 0,
      product_limit: Number(productLimit) || 10,
      user_limit: Number(userLimit) || 1,
      ai_text_credits: Number(aiText) || 0,
      ai_image_credits: Number(aiImage) || 0,
      qr_analytics_enabled: qrAnalytics,
      custom_domain_enabled: customDomain,
      advanced_reports_enabled: advancedReports,
    }

    const toastId = toast.loading(editing ? "Actualizando plan..." : "Creando plan...")

    startTransition(async () => {
      if (editing) {
        const result = await updatePlan(editing.id, formData)
        if (result.success) {
          toast.success("Plan actualizado", { id: toastId })
          setPlans(prev => prev.map(p => p.id === editing.id ? { ...p, ...formData } : p))
          setDialogOpen(false)
        } else {
          toast.error(result.error || "Error", { id: toastId })
        }
      } else {
        const result = await createPlan({ ...formData, is_active: true })
        if (result.success && result.data) {
          toast.success("Plan creado", { id: toastId })
          setPlans(prev => [...prev, { id: result.data!.id, ...formData, is_active: true }])
          setDialogOpen(false)
        } else {
          toast.error(result.error || "Error", { id: toastId })
        }
      }
    })
  }

  const handleDelete = (plan: Plan) => {
    const count = userCountForPlan(plan.name)
    if (count > 0) {
      toast.error(`No se puede eliminar: ${count} tienda${count > 1 ? "s" : ""} usan este plan`)
      return
    }

    const toastId = toast.loading("Eliminando plan...")
    startTransition(async () => {
      const result = await deletePlan(plan.id)
      if (result.success) {
        toast.success("Plan eliminado", { id: toastId })
        setPlans(prev => prev.filter(p => p.id !== plan.id))
      } else {
        toast.error(result.error || "Error", { id: toastId })
      }
    })
  }

  const handleToggleActive = (plan: Plan) => {
    const newActive = !plan.is_active
    const toastId = toast.loading(newActive ? "Activando plan..." : "Desactivando plan...")
    startTransition(async () => {
      const result = await updatePlan(plan.id, { is_active: newActive })
      if (result.success) {
        toast.success(newActive ? "Plan activado" : "Plan desactivado", { id: toastId })
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: newActive } : p))
        router.refresh()
      } else {
        toast.error(result.error || "Error", { id: toastId })
      }
    })
  }

  return (
    <div className="space-y-4">
      <Button onClick={openNew} className="rounded-xl font-bold gap-2">
        <Plus className="h-4 w-4" /> Nuevo Plan
      </Button>

      <div className="grid gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-2xl border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black">{plan.name}</h3>
                  <Badge
                    className={
                      plan.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    }
                  >
                    {plan.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{plan.code}</span>
                </div>
                <p className="text-2xl font-black mt-1">
                  ${Number(plan.price_monthly).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} className="h-8 w-8 rounded-lg">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(plan)} className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" /> {plan.product_limit} productos
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" /> {plan.user_limit} usuarios
              </Badge>
              {plan.ai_text_credits > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" /> {plan.ai_text_credits} AI texto
                </Badge>
              )}
              {plan.ai_image_credits > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" /> {plan.ai_image_credits} AI img
                </Badge>
              )}
              {plan.qr_analytics_enabled && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 gap-1">
                  <QrCode className="h-3 w-3" /> QR Analytics
                </Badge>
              )}
              {plan.custom_domain_enabled && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 gap-1">
                  <Globe className="h-3 w-3" /> Dominio propio
                </Badge>
              )}
              {plan.advanced_reports_enabled && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 gap-1">
                  <BarChart3 className="h-3 w-3" /> Reportes avanzados
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                {userCountForPlan(plan.name)} tienda{userCountForPlan(plan.name) !== 1 ? "s" : ""} activa{userCountForPlan(plan.name) !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => handleToggleActive(plan)}
                disabled={isPending}
                className={`text-xs font-bold cursor-pointer transition-colors ${
                  plan.is_active
                    ? "text-red-500 hover:text-red-600"
                    : "text-green-500 hover:text-green-600"
                }`}
              >
                {plan.is_active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{editing ? "Editar Plan" : "Nuevo Plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Código</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="plus"
                  className="rounded-xl h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Nombre</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Plus"
                  className="rounded-xl h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Precio mensual ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Límite productos</label>
                <Input
                  type="number"
                  value={productLimit}
                  onChange={e => setProductLimit(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Límite usuarios</label>
                <Input
                  type="number"
                  value={userLimit}
                  onChange={e => setUserLimit(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Créditos AI texto</label>
                <Input
                  type="number"
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  className="rounded-xl h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">Créditos AI imágenes</label>
              <Input
                type="number"
                value={aiImage}
                onChange={e => setAiImage(e.target.value)}
                className="rounded-xl h-9 text-sm"
              />
            </div>

            {/* Feature toggles */}
            <div className="space-y-3 pt-2 border-t">
              <label className="text-xs font-bold uppercase text-muted-foreground">Funcionalidades</label>
              {[
                { label: "QR Analytics", value: qrAnalytics, set: setQrAnalytics },
                { label: "Dominio personalizado", value: customDomain, set: setCustomDomain },
                { label: "Reportes avanzados", value: advancedReports, set: setAdvancedReports },
              ].map(f => (
                <label key={f.label} className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm">{f.label}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => f.set(!f.value)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      f.value ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        f.value ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}