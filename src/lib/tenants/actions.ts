"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  brand_color?: string | null;
  secondary_color?: string | null;
  address?: Address | string | null;
  social_links?: SocialLinks | null;
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

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

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

export async function ensureUserTenant(): Promise<ActionResult<Tenant>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Check if user already has a tenant
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("created_by", user.id)
      .limit(1)
      .maybeSingle();

    if (existingTenant) {
      return { success: true, data: existingTenant as unknown as Tenant };
    }

    // Generate unique slug
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomStr = "";
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const slug = `tienda-${randomStr}`;

    // Create tenant in draft status
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: "Mi Tienda",
        slug: slug,
        created_by: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (tenantError) {
      return { success: false, error: `Error al crear sucursal por defecto: ${tenantError.message}` };
    }

    // Assign owner member
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

    // Retrieve free plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("code", "free")
      .single();

    if (planError || !plan) {
      return { success: false, error: "No se pudo encontrar el plan gratuito inicial." };
    }

    // Create free subscription
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
    console.error("ensureUserTenant error:", error);
    return { success: false, error: "Error inesperado al asegurar sucursal" };
  }
}



export type UpdateTenantSettingsInput = {
  name?: string;
  slug?: string;
  status?: string;
  brand_color?: string | null;
  secondary_color?: string | null;
  address?: Address | null;
  social_links?: SocialLinks | null;
};

function isValidHexColor(value: string | null | undefined): boolean {
  if (value === null || value === undefined || value === "") return true;
  return HEX_COLOR_REGEX.test(value);
}

export async function updateTenantSettings(
  id: string,
  input: UpdateTenantSettingsInput
): Promise<ActionResult<Tenant>> {
  try {
    // Validate color formats if provided
    if (input.brand_color !== undefined && !isValidHexColor(input.brand_color)) {
      return { success: false, error: "Invalid brand_color format" };
    }
    if (input.secondary_color !== undefined && !isValidHexColor(input.secondary_color)) {
      return { success: false, error: "Invalid secondary_color format" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    // Fetch existing tenant to check ownership and values
    const { data: currentTenant, error: getError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (getError || !currentTenant) {
      return { success: false, error: "Sucursal no encontrada o sin acceso" };
    }

    let newSlug = currentTenant.slug;
    if (input.slug !== undefined) {
      newSlug = input.slug.trim().toLowerCase();
      if (newSlug !== currentTenant.slug) {
        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(newSlug) || newSlug.length < 2 || newSlug.length > 60) {
          return { success: false, error: "Formato de slug inválido. Solo letras minúsculas, números y guiones." };
        }

        // Check if slug is taken by another tenant
        const { data: existingSlug } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", id)
          .maybeSingle();

        if (existingSlug) {
          return { success: false, error: "El slug ya está en uso por otra tienda." };
        }
      }
    }

    const finalName = input.name !== undefined ? input.name.trim() : currentTenant.name;
    const finalStatus = input.status !== undefined ? input.status : currentTenant.status;

    // Validate publishing rules
    if (finalStatus === "active") {
      if (finalName === "Mi Tienda") {
        return { success: false, error: "No se puede publicar la tienda con el nombre por defecto 'Mi Tienda'." };
      }
      if (newSlug.startsWith("tienda-")) {
        return { success: false, error: "No se puede publicar la tienda con un slug por defecto que empiece con 'tienda-'." };
      }
    }

    const updateData: Partial<Tenant> = {};
    if (input.name !== undefined) updateData.name = finalName;
    if (input.slug !== undefined) updateData.slug = newSlug;
    if (input.status !== undefined) updateData.status = finalStatus;
    if (input.brand_color !== undefined) updateData.brand_color = input.brand_color ?? null;
    if (input.secondary_color !== undefined) updateData.secondary_color = input.secondary_color ?? null;
    if (input.address !== undefined) updateData.address = input.address ?? null;
    if (input.social_links !== undefined) updateData.social_links = input.social_links ?? null;

    // Explicit Tenant Isolation: Filter by ID AND creator to ensure ownership before RLS
    const { data: tenant, error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Get the tenant slug to revalidate the public storefront page
    const slug = (tenant as unknown as { slug: string }).slug;
    revalidatePath(`/${slug}`);
    revalidatePath("/dashboard/settings");
    if (currentTenant.slug !== slug) {
      revalidatePath(`/${currentTenant.slug}`);
    }

    return { success: true, data: tenant as unknown as Tenant };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al actualizar la personalización" };
  }
}

/**
 * @deprecated Use updateTenantSettings instead
 */
export async function updateTenantBranding(
  id: string,
  input: UpdateTenantSettingsInput
): Promise<ActionResult<Tenant>> {
  return updateTenantSettings(id, input);
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
    product_limit: number;
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

export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug) || slug.length < 2 || slug.length > 60) {
      return { available: false, error: "Formato de slug inválido. Solo letras minúsculas, números y guiones." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { available: false, error: "No autorizado" };

    const { data, error } = await supabase
      .from("tenants")
      .select("slug")
      .eq("slug", slug)
      .limit(1);

    if (error) return { available: false, error: "Error al verificar disponibilidad" };

    return { available: !data || data.length === 0 };
  } catch (error) {
    console.error("CheckSlugAvailability Error:", error);
    return { available: false, error: "Error inesperado al verificar slug" };
  }
}

export async function getTenantSubscription(tenantId: string): Promise<ActionResult<TenantSubscription>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenant_subscriptions")
      .select("id, tenant_id, plans(name, product_limit)")
      .eq("tenant_id", tenantId)
      .limit(1)
      .single();

    if (error) return { success: false, error: error.message };
    
    // Transformación segura del resultado de Supabase
    const rawPlans = data.plans as unknown as { name: string; product_limit: number } | null;
    const planName = rawPlans ? String(rawPlans.name) : "N/A";
    const productLimit = rawPlans ? Number(rawPlans.product_limit) : 10;

    const subscription: TenantSubscription = {
      id: data.id,
      tenant_id: data.tenant_id,
      plans: { name: planName, product_limit: productLimit }
    };

    return { success: true, data: subscription };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error al obtener suscripción" };
  }
}
