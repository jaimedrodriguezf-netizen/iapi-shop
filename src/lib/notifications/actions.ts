"use server"

import { createClient } from "@/lib/supabase/server"

export interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

export async function getNotifications(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: true, data: [] }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("getNotifications:", error)
      return { success: false, error: "Error al cargar notificaciones" }
    }
    return { success: true, data: data as Notification[] }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return count ?? 0
  } catch {
    return 0
  }
}

export async function markAsRead(id: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
    
    return !error
  } catch {
    return false
  }
}

export async function markAllAsRead(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
    
    return !error
  } catch {
    return false
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body?: string,
  link?: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, type, title, body, link })
    
    return !error
  } catch {
    return false
  }
}