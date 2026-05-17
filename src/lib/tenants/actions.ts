"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateTenantInput = {
  name: string;
  slug: string;
  whatsapp_phone?: string;
};

export async function createTenant(input: CreateTenantInput) {
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
      status: "active", // Por ahora lo activamos directo
    })
    .select()
    .single();

  if (tenantError) {
    return { success: false, error: tenantError.message };
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
    return { success: false, error: memberError.message };
  }

  // 4. Asignar plan 'free' inicial
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("code", "free")
    .single();

  if (plan) {
    await supabase.from("tenant_subscriptions").insert({
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: "active",
    });
  }

  return { success: true, tenant };
}
