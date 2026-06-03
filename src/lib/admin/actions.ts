"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
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

    // Adaptar a una lista mutable
    interface ProfileWithAdmin {
      id: string;
      email: string;
      full_name: string | null;
      created_at: string;
      platform_admins: { role: "admin" | "support" | "moderator" | "billing_admin" } | { role: "admin" | "support" | "moderator" | "billing_admin" }[] | null;
    }

    const profilesList: ProfileWithAdmin[] = (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      platform_admins: p.platform_admins as ProfileWithAdmin["platform_admins"]
    }));

    // Sincronizar en caliente perfiles faltantes si el adminClient está disponible
    const adminClient = await createAdminClient();
    if (adminClient) {
      const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
      if (!authError && authData?.users) {
        const profileIds = new Set(profilesList.map((p) => p.id));
        for (const authUser of authData.users) {
          if (authUser.email && !profileIds.has(authUser.id)) {
            const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;
            
            // Insertar perfil faltante en profiles (autocure)
            const { data: newProfile, error: insertError } = await adminClient
              .from("profiles")
              .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: name,
                created_at: authUser.created_at,
              })
              .select(`
                id,
                email,
                full_name,
                created_at,
                platform_admins ( role )
              `)
              .single();

            if (!insertError && newProfile) {
              profilesList.push({
                id: newProfile.id,
                email: newProfile.email,
                full_name: newProfile.full_name,
                created_at: newProfile.created_at,
                platform_admins: newProfile.platform_admins as ProfileWithAdmin["platform_admins"]
              });
            } else {
              // Fallback en memoria si la base de datos falla al insertar
              profilesList.push({
                id: authUser.id,
                email: authUser.email,
                full_name: name,
                created_at: authUser.created_at,
                platform_admins: null,
              });
            }
          }
        }
      }
    }

    // 2. Obtener todas las relaciones de miembros de tiendas con conteo de productos agregados en base de datos
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
          ),
          products ( count )
        )
      `);

    if (membersError) {
      return { success: false, error: `Error al obtener miembros: ${membersError.message}` };
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
          products: { count: number }[] | { count: number } | null;
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

          // Resolver conteo de productos
          let productCount = 0;
          if (rawTenant.products) {
            if (Array.isArray(rawTenant.products)) {
              productCount = rawTenant.products[0]?.count || 0;
            } else {
              productCount = (rawTenant.products as { count: number }).count || 0;
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
            productCount,
          });
        }
      }
    }

    // 4. Consolidar el resultado final de SaaSUser
    const saasUsers: SaaSUser[] = profilesList.map((p) => {
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
