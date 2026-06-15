"use server"

import { createClient } from "@/lib/supabase/server"
import { ActionResult } from "@/lib/auth/actions"
import { revalidatePath } from "next/cache"

export interface PromoBanner {
  id: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_href: string | null
  image_url: string | null
  bg_color: string
  display_order: number
  is_active: boolean
}

/** Get all active promo banners for the public landing page */
export async function getPromoBanners(): Promise<ActionResult<PromoBanner[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("promo_banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order")

    if (error) {
      console.error("getPromoBanners:", error)
      return { success: false, error: "Error al cargar banners" }
    }
    return { success: true, data: data as PromoBanner[] }
  } catch (err) {
    console.error("getPromoBanners error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

/** Get ALL banners (including inactive) for admin management */
export async function getAllBanners(): Promise<ActionResult<PromoBanner[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("promo_banners")
      .select("*")
      .order("display_order")

    if (error) {
      console.error("getAllBanners:", error)
      return { success: false, error: "Error al cargar banners" }
    }
    return { success: true, data: data as PromoBanner[] }
  } catch (err) {
    console.error("getAllBanners error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function createBanner(
  banner: Omit<PromoBanner, "id">
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("promo_banners")
      .insert(banner)
      .select("id")
      .single()

    if (error) {
      console.error("createBanner:", error)
      return { success: false, error: "Error al crear banner" }
    }
    revalidatePath("/")
    return { success: true, data: data as { id: string } }
  } catch (err) {
    console.error("createBanner error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function updateBanner(
  id: string,
  updates: Partial<Pick<PromoBanner, "title" | "subtitle" | "cta_text" | "cta_href" | "image_url" | "bg_color" | "display_order" | "is_active">>
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("promo_banners")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("updateBanner:", error)
      return { success: false, error: "Error al actualizar banner" }
    }
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    console.error("updateBanner error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function deleteBanner(
  id: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("promo_banners")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("deleteBanner:", error)
      return { success: false, error: "Error al eliminar banner" }
    }
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    console.error("deleteBanner error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function uploadBannerImage(
  file: File
): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createClient()
    const ext = file.name.split(".").pop() || "webp"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(filename, buffer, { 
        contentType: file.type || "image/webp",
        cacheControl: "31536000",
      })

    if (uploadError) {
      console.error("uploadBannerImage:", uploadError)
      return { success: false, error: "Error al subir imagen" }
    }

    const { data: urlData } = supabase.storage
      .from("banners")
      .getPublicUrl(filename)

    return { success: true, data: { url: urlData.publicUrl } }
  } catch (err) {
    console.error("uploadBannerImage error:", err)
    return { success: false, error: "Error inesperado" }
  }
}