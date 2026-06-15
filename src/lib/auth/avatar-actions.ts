"use server"

import { createClient } from "@/lib/supabase/server"
import { ActionResult } from "@/lib/auth/actions"
import { revalidatePath } from "next/cache"

export async function uploadAvatar(file: File): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = `${user.id}-${Date.now()}.webp`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, buffer, { contentType: "image/webp", upsert: true })

    if (uploadError) {
      console.error("uploadAvatar:", uploadError)
      return { success: false, error: "Error al subir imagen" }
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filename)
    const avatarUrl = urlData.publicUrl

    // Update profiles table (profile always exists via trigger)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error("uploadAvatar update profile:", updateError)
      return { success: false, error: "Error al actualizar perfil" }
    }

    revalidatePath("/")
    revalidatePath("/perfil")
    return { success: true, data: { url: avatarUrl } }
  } catch (err) {
    console.error("uploadAvatar error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function removeAvatar(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id)

    if (error) return { success: false, error: "Error al eliminar foto" }
    revalidatePath("/")
    revalidatePath("/perfil")
    return { success: true }
  } catch {
    return { success: false, error: "Error inesperado" }
  }
}