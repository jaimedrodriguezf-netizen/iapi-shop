"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateTenantInput = {
  name: string;
  slug: string;
  whatsapp_phone?: string;
};

export async function getMyTenant() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("created_by", user.id)
      .limit(1)
      .single();

    if (error || !tenant) return { success: false, error: "Sucursal no encontrada" };

    return { success: true, tenant };
  } catch (error) {
    return { success: false, error: "Error al obtener la sucursal" };
  }
}

export async function createTenant(input: CreateTenantInput) {
  try {
    const supabase = await createClient();

    // 1. Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // 2. Insertar el Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: input.name,
        slug: input.slug,
        whatsapp_phone: input.whatsapp_phone,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();

    if (tenantError) {
      return { success: false, error: `Error al crear sucursal: ${tenantError.message}` };
    }

    // 3. Asignar al creador como 'owner' en tenant_members
    const { error: memberError } = await supabase
      .from("tenant_members")
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      });

    if (memberError) {
      return { success: false, error: `Error al asignar rol de dueño: ${memberError.message}` };
    }

    // 4. Asignar plan 'free' inicial (Operación crítica para la integridad)
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (planError || !plan) {
      return { success: false, error: "No se pudo encontrar el plan gratuito inicial." };
    }

    const { error: subError } = await supabase.from("tenant_subscriptions").insert({
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: "active",
    });

    if (subError) {
      return { success: false, error: `Error al activar la suscripción gratuita: ${subError.message}` };
    }

    return { success: true, tenant };
  } catch (error) {
    console.error("Create Tenant Error:", error);
    return { success: false, error: "Error inesperado al crear la sucursal" };
  }
}
