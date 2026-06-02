"use server";

import { createClient } from "@/lib/supabase/server";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  brand_color?: string;
  secondary_color?: string;
  address?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  whatsapp_phone?: string;
  logo_url?: string;
  status: string;
  created_at: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getMyTenant(): Promise<ActionResult<Tenant>> {
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

    return { success: true, data: tenant as unknown as Tenant };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al obtener la sucursal" };
  }
}

export type UpdateTenantBrandingInput = {
  brand_color?: string;
  secondary_color?: string;
  address?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
};

export async function updateTenantBranding(id: string, input: UpdateTenantBrandingInput): Promise<ActionResult<Tenant>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    // Explicit Tenant Isolation: Filter by ID AND creator to ensure ownership before RLS
    const { data: tenant, error } = await supabase
      .from("tenants")
      .update({
        brand_color: input.brand_color,
        secondary_color: input.secondary_color,
        address: input.address,
        social_links: input.social_links,
      })
      .eq("id", id)
      .eq("created_by", user.id) 
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: tenant as unknown as Tenant };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al actualizar la personalización" };
  }
}

export type CreateTenantInput = {
  name: string;
  slug: string;
  whatsapp_phone?: string;
};

export async function createTenant(input: CreateTenantInput): Promise<ActionResult<Tenant>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("createTenant authError:", authError, "user:", user);
      return { success: false, error: "No autorizado" };
    }

    // 2. Validar límite de sucursales: solo el plan 'business' permite múltiples sucursales
    const { data: existingTenants, error: countError } = await supabase
      .from("tenants")
      .select("id")
      .eq("created_by", user.id);

    if (countError) {
      return { success: false, error: "Error al validar límite de sucursales" };
    }

    if (existingTenants && existingTenants.length >= 1) {
      const tenantIds = existingTenants.map(t => t.id);
      
      const { data: subs, error: subsError } = await supabase
        .from("tenant_subscriptions")
        .select("id, status, plans(code)")
        .in("tenant_id", tenantIds)
        .eq("status", "active");

      if (subsError) {
        return { success: false, error: "Error al verificar planes de suscripción" };
      }

      const hasBusiness = subs?.some(sub => {
        const rawPlan = sub.plans as unknown as { code: string } | null;
        return rawPlan?.code === "business";
      });

      if (!hasBusiness) {
        return { 
          success: false, 
          error: "El plan actual solo permite tener una sucursal individual. Para agregar más sucursales, por favor adquiere el Plan Business." 
        };
      }
    }

    // 3. Insertar el Tenant
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

    return { success: true, data: tenant as unknown as Tenant };
  } catch (error) {
    console.error("Create Tenant Error:", error);
    return { success: false, error: "Error inesperado al crear la sucursal" };
  }
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plans: {
    name: string;
  } | null;
}

export async function getMyTenants(): Promise<ActionResult<Tenant[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Tenant[] };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al obtener sucursales" };
  }
}

export async function getTenantSubscription(tenantId: string): Promise<ActionResult<TenantSubscription>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenant_subscriptions")
      .select("id, tenant_id, plans(name)")
      .eq("tenant_id", tenantId)
      .limit(1)
      .single();

    if (error) return { success: false, error: error.message };
    
    // Transformación segura del resultado de Supabase
    const rawPlans = data.plans as unknown as { name: string } | null;
    const planName = rawPlans ? String(rawPlans.name) : "N/A";

    const subscription: TenantSubscription = {
      id: data.id,
      tenant_id: data.tenant_id,
      plans: { name: planName }
    };

    return { success: true, data: subscription };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al obtener suscripción" };
  }
}
