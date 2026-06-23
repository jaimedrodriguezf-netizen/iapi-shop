"use server"

import { createClient } from "@/lib/supabase/server"

export async function followTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const { error } = await supabase
      .from("tenant_followers")
      .upsert({ user_id: user.id, tenant_id: tenantId }, { onConflict: "user_id,tenant_id" })

    if (error) {
      console.error("followTenant:", error)
      return { success: false, error: "Error al seguir la tienda" }
    }
    return { success: true }
  } catch (err) {
    console.error("followTenant error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function unfollowTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const { error } = await supabase
      .from("tenant_followers")
      .delete()
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("unfollowTenant:", error)
      return { success: false, error: "Error al dejar de seguir" }
    }
    return { success: true }
  } catch (err) {
    console.error("unfollowTenant error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function getFollowedTenants(): Promise<{ success: boolean; data?: Array<{ id: string; name: string; slug: string; logo_url: string | null }>; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const { data, error } = await supabase
      .from("tenant_followers")
      .select("tenant_id, tenants(id, name, slug, logo_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("getFollowedTenants:", error)
      return { success: false, error: "Error al cargar tiendas seguidas" }
    }

     
    const followed = (data || []).flatMap(f => {
      const t = (f as unknown as { tenants: { id: string; name: string; slug: string; logo_url: string | null } | null }).tenants
      return t ? [{ id: t.id, name: t.name, slug: t.slug, logo_url: t.logo_url }] : []
    })

    return { success: true, data: followed }
  } catch (err) {
    console.error("getFollowedTenants error:", err)
    return { success: false, error: "Error inesperado" }
  }
}
