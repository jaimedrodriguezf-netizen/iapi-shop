"use server"

import { createClient } from "@/lib/supabase/server"
import { ActionResult } from "@/lib/auth/actions"
import { revalidatePath } from "next/cache"

export interface Plan {
  id: string
  code: string
  name: string
  price_monthly: number
  product_limit: number
  user_limit: number
  ai_text_credits: number
  ai_image_credits: number
  qr_analytics_enabled: boolean
  custom_domain_enabled: boolean
  advanced_reports_enabled: boolean
  is_active: boolean
}

export async function getAllPlans(): Promise<ActionResult<Plan[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("plans").select("*").order("price_monthly")
    if (error) return { success: false, error: "Error al cargar planes" }
    return { success: true, data: data as Plan[] }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}

export async function createPlan(plan: Omit<Plan, "id">): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("plans")
      .insert(plan)
      .select("id")
      .single()
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        return { success: false, error: "El código ya existe" }
      }
      return { success: false, error: "Error al crear plan" }
    }
    revalidatePath("/dashboard/admin/subscriptions")
    return { success: true, data: { id: data.id } }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}

export async function updatePlan(id: string, updates: Partial<Plan>): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("plans").update(updates).eq("id", id)
    if (error) return { success: false, error: "Error al actualizar plan" }
    revalidatePath("/dashboard/admin/subscriptions")
    return { success: true }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}

export async function deletePlan(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("plans").delete().eq("id", id)
    if (error) return { success: false, error: "No se puede eliminar: hay suscripciones activas con este plan" }
    revalidatePath("/dashboard/admin/subscriptions")
    return { success: true }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}