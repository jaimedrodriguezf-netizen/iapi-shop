"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, Store, Package } from "lucide-react";
import { toast } from "sonner";
import { SaaSUser, updatePlatformRole, updateTenantPlan } from "@/lib/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AdminUsersClientProps {
  initialUsers: SaaSUser[];
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");

  // Modales y estados de edición
  const [editingRoleUser, setEditingRoleUser] = useState<SaaSUser | null>(null);
  const [newPlatformRole, setNewPlatformRole] = useState<"admin" | "merchant">("merchant");

  const [editingPlanTenant, setEditingPlanTenant] = useState<{
    tenantId: string;
    tenantName: string;
    currentPlan: string;
  } | null>(null);
  const [newPlanCode, setNewPlanCode] = useState<"free" | "starter" | "pro" | "plus">("free");

  // Filtrar en memoria
  const filteredUsers = initialUsers.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesEmail = user.email.toLowerCase().includes(term);
    const matchesName = (user.full_name || "").toLowerCase().includes(term);
    const matchesTenant = user.tenants.some((t) => t.name.toLowerCase().includes(term));
    return matchesEmail || matchesName || matchesTenant;
  });

  const handleUpdateRole = () => {
    if (!editingRoleUser) return;
    const toastId = toast.loading("Actualizando rol de plataforma...");

    startTransition(async () => {
      const res = await updatePlatformRole(editingRoleUser.id, newPlatformRole);
      if (res.success) {
        toast.success("Rol actualizado con éxito", { id: toastId });
        setEditingRoleUser(null);
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo actualizar el rol", { id: toastId });
      }
    });
  };

  const handleUpdatePlan = () => {
    if (!editingPlanTenant) return;
    const toastId = toast.loading("Actualizando plan de sucursal...");

    startTransition(async () => {
      const res = await updateTenantPlan(editingPlanTenant.tenantId, newPlanCode);
      if (res.success) {
        toast.success("Plan de sucursal actualizado", { id: toastId });
        setEditingPlanTenant(null);
        router.refresh();
      } else {
        toast.error(res.error || "No se pudo cambiar el plan", { id: toastId });
      }
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios, emails o tiendas…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Grid / Tabla Responsive de Usuarios */}
      <div className="rounded-3xl border bg-background overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol SaaS</th>
                <th className="px-6 py-4">Sucursales, Planes y Catálogos</th>
                <th className="px-6 py-4">Creado en</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground font-semibold">
                    No se encontraron usuarios registrados en la plataforma.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                    {/* Usuario */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          {user.full_name || "Sin nombre registrado"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{user.email}</span>
                      </div>
                    </td>

                    {/* Rol SaaS */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={user.platformRole === "admin" ? "default" : "secondary"}
                          className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[10px] tracking-wider ${
                            user.platformRole === "admin"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/40 dark:border-orange-900/50"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {user.platformRole === "admin" ? "Admin" : "Vendedor"}
                        </Badge>
                      </div>
                    </td>

                    {/* Tiendas / Planes / Productos */}
                    <td className="px-6 py-5">
                      {user.tenants.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Ninguna sucursal creada</span>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {user.tenants.map((t) => (
                            <div
                              key={t.id}
                              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 p-2 rounded-xl bg-muted/40 border text-xs"
                            >
                              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-zinc-200">
                                <Store className="h-3.5 w-3.5 text-orange-500" />
                                {t.name}
                              </div>
                              
                              <Badge
                                className={`rounded-full font-black text-[9px] uppercase tracking-wider ${
                                  t.planName.toLowerCase() === "plus"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/50"
                                    : t.planName.toLowerCase() === "pro"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
                                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                              >
                                {t.planName}
                              </Badge>

                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                <Package className="h-3 w-3" />
                                {t.productCount} {t.productCount === 1 ? "producto" : "productos"}
                              </div>

                              {/* Si es vendedor regular, permitir editar el plan de su tienda */}
                              {user.platformRole !== "admin" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPlanTenant({
                                      tenantId: t.id,
                                      tenantName: t.name,
                                      currentPlan: t.planName,
                                    });
                                    const codeMap: Record<string, string> = {
                                      Starter: "starter",
                                      Pro: "pro",
                                      Plus: "plus",
                                    };
                                    setNewPlanCode((codeMap[t.planName] || "starter") as "starter" | "pro" | "plus");
                                  }}
                                  className="ml-auto text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-bold hover:underline cursor-pointer"
                                >
                                  Editar Plan
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Fecha de Registro */}
                    <td className="px-6 py-5 text-muted-foreground font-medium">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRoleUser(user);
                          setNewPlatformRole(user.platformRole);
                        }}
                        className="rounded-xl font-bold gap-1 cursor-pointer"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Rol SaaS
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Editar Rol de Plataforma */}
      <Dialog open={!!editingRoleUser} onOpenChange={(open) => !open && setEditingRoleUser(null)}>
        <DialogContent className="rounded-3xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-orange-500">Cambiar Rol SaaS</DialogTitle>
            <DialogDescription>
              Modifica los privilegios globales de <span className="font-bold text-foreground">{editingRoleUser?.email}</span> en la plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-bold block mb-1">Privilegio de Plataforma</label>
            <Select
              value={newPlatformRole}
              onValueChange={(val) => setNewPlatformRole(val as "admin" | "merchant")}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="merchant">Vendedor (Sujeto a límites de planes)</SelectItem>
                <SelectItem value="admin">Administrador (Control total, bypass de límites)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingRoleUser(null)}
              className="rounded-xl font-bold cursor-pointer"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "Actualizar Rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Plan de Sucursal */}
      <Dialog open={!!editingPlanTenant} onOpenChange={(open) => !open && setEditingPlanTenant(null)}>
        <DialogContent className="rounded-3xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-orange-500">Cambiar Plan de Sucursal</DialogTitle>
            <DialogDescription>
              Asigna un plan de suscripción para la sucursal <span className="font-bold text-foreground">{editingPlanTenant?.tenantName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-bold block mb-1">Plan de Suscripción</label>
            <Select
              value={newPlanCode}
              onValueChange={(val) => setNewPlanCode(val as "free" | "starter" | "pro" | "plus")}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="free">Free (5 prod, 1 foto, 1 sucursal)</SelectItem>
                <SelectItem value="starter">Starter (50 prod, 3 fotos, 1 sucursal)</SelectItem>
                <SelectItem value="pro">Pro (300 prod, 3 fotos, 1 sucursal)</SelectItem>
                <SelectItem value="plus">Plus (2000 prod, 6 fotos, multi-sucursal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPlanTenant(null)}
              className="rounded-xl font-bold cursor-pointer"
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePlan}
              className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              disabled={isPending}
            >
              {isPending ? "Guardando…" : "Actualizar Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
