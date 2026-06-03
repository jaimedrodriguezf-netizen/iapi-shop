"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRoleInfo, ActionResult } from "@/lib/auth/actions";

export interface SaaSUser {
  id: string;
  email: string;
  full_name: string | null;
  platformRole: "admin" | "merchant";
  tenants: {
    id: string;
    name: string;
    slug: string;
    planName: string;
    productCount: number;
  }[];
  created_at: string;
}

// Auxiliar para validar si el usuario es administrador de plataforma
async function assertIsAdmin(): Promise<{ success: boolean; error?: string }> {
  const roleInfo = await getUserRoleInfo();
  if (!roleInfo.success || roleInfo.data?.platformRole !== "admin") {
    return { success: false, error: "No autorizado. Se requieren privilegios de administrador de plataforma." };
  }
  return { success: true };
}

export async function getSaaSUsers(): Promise<ActionResult<SaaSUser[]>> {
  try {
    const adminCheck = await assertIsAdmin();
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error };
    }

    const supabase = await createClient();

    // 1. Obtener todos los perfiles de usuario
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        created_at,
        platform_admins ( role )
      `)
      .order("created_at", { ascending: false });

    if (profilesError) {
      return { success: false, error: `Error al obtener perfiles: ${profilesError.message}` };
    }

    // 2. Obtener todas las relaciones de miembros de tiendas
    const { data: members, error: membersError } = await supabase
      .from("tenant_members")
      .select(`
        user_id,
        role,
        tenant_id,
        tenants (
          id,
          name,
          slug,
          tenant_subscriptions (
            plans ( name, code )
          )
        )
      `);

    if (membersError) {
      return { success: false, error: `Error al obtener miembros: ${membersError.message}` };
    }

    // 3. Obtener todos los productos para contar por tenant en memoria (eficiente)
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("tenant_id");

    if (productsError) {
      return { success: false, error: `Error al obtener productos: ${productsError.message}` };
    }

    // Procesar conteos de productos
    const productCounts: Record<string, number> = {};
    if (products) {
      for (const p of products) {
        if (p.tenant_id) {
          productCounts[p.tenant_id] = (productCounts[p.tenant_id] || 0) + 1;
        }
      }
    }

    // Mapear sucursales por usuario
    const userTenantsMap: Record<string, SaaSUser["tenants"]> = {};
    if (members) {
      for (const m of members) {
        const userId = m.user_id;
        const rawTenant = m.tenants as unknown as {
          id: string;
          name: string;
          slug: string;
          tenant_subscriptions: { plans: { name: string; code: string } } | { plans: { name: string; code: string } }[] | null;
        } | null;

        if (rawTenant) {
          // Normalizar el planName debido a posibles arrays de Supabase
          let planName = "Free";
          const sub = rawTenant.tenant_subscriptions;
          if (sub) {
            if (Array.isArray(sub)) {
              if (sub.length > 0 && sub[0].plans) {
                planName = sub[0].plans.name;
              }
            } else if (sub.plans) {
              planName = sub.plans.name;
            }
          }

          if (!userTenantsMap[userId]) {
            userTenantsMap[userId] = [];
          }

          userTenantsMap[userId].push({
            id: rawTenant.id,
            name: rawTenant.name,
            slug: rawTenant.slug,
            planName,
            productCount: productCounts[rawTenant.id] || 0,
          });
        }
      }
    }

    // 4. Consolidar el resultado final de SaaSUser
    const saasUsers: SaaSUser[] = (profiles || []).map((p) => {
      const isPlatformAdmin = Array.isArray(p.platform_admins) 
        ? p.platform_admins.length > 0 
        : !!p.platform_admins;
      
      const platformRole = isPlatformAdmin ? "admin" : "merchant";

      // Forzar plan business para administradores
      const tenants = userTenantsMap[p.id] || [];
      const normalizedTenants = platformRole === "admin" 
        ? tenants.map(t => ({ ...t, planName: "Business" }))
        : tenants;

      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        platformRole,
        tenants: normalizedTenants,
        created_at: p.created_at,
      };
    });

    return { success: true, data: saasUsers };
  } catch (err: unknown) {
    console.error("getSaaSUsers error:", err);
    return { success: false, error: "Error inesperado al recuperar usuarios." };
  }
}

export async function updatePlatformRole(userId: string, role: "admin" | "merchant"): Promise<ActionResult<void>> {
  try {
    const adminCheck = await assertIsAdmin();
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error };
    }

    const supabase = await createClient();

    if (role === "admin") {
      // Promover a Admin de Plataforma
      const { error } = await supabase
        .from("platform_admins")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

      if (error) return { success: false, error: `Error al promover: ${error.message}` };
    } else {
      // Degradar a merchant (eliminar de platform_admins)
      const { error } = await supabase
        .from("platform_admins")
        .delete()
        .eq("user_id", userId);

      if (error) return { success: false, error: `Error al degradar: ${error.message}` };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updatePlatformRole error:", err);
    return { success: false, error: "Error inesperado al actualizar rol de plataforma." };
  }
}

export async function updateTenantPlan(tenantId: string, planCode: "free" | "starter" | "pro" | "business"): Promise<ActionResult<void>> {
  try {
    const adminCheck = await assertIsAdmin();
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error };
    }

    const supabase = await createClient();

    // 1. Encontrar el plan ID asociado al código
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id")
      .eq("code", planCode)
      .single();

    if (planError || !plan) {
      return { success: false, error: "No se encontró el plan especificado." };
    }

    // 2. Actualizar o insertar la suscripción activa
    const { error: subError } = await supabase
      .from("tenant_subscriptions")
      .upsert({
        tenant_id: tenantId,
        plan_id: plan.id,
        status: "active",
      }, { onConflict: "tenant_id" });

    if (subError) {
      return { success: false, error: `Error al actualizar la suscripción: ${subError.message}` };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateTenantPlan error:", err);
    return { success: false, error: "Error inesperado al cambiar el plan de la sucursal." };
  }
}
