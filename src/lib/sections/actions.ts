"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Section {
  id: string
  tenant_id?: string | null
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  display_order: number
  is_active: boolean
}

export interface SectionProduct {
  id: string
  section_id: string
  product_id: string
  display_order: number
}

interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ─── Marketplace sections ────────────────────────

export async function getMarketplaceSections(): Promise<ActionResult<Section[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .is("tenant_id", null)
      .eq("is_active", true)
      .order("display_order")
    
    if (error) {
      console.error("getMarketplaceSections:", error)
      return { success: false, error: "Error al cargar secciones" }
    }
    return { success: true, data: data as Section[] }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function getSectionProducts(sectionId: string): Promise<ActionResult<{ id: string; tenant_id?: string; name: string; price: number; compare_at_price: number | null; image_urls: string[]; description?: string | null; tenant_name?: string | null; tenant_slug?: string | null }[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("section_products")
      .select("product_id, products(id, tenant_id, name, price, compare_at_price, description, product_images(url, display_order), tenants(name, slug))")
      .eq("section_id", sectionId)
      .order("display_order")
    
    if (error) {
      console.error("getSectionProducts:", error)
      return { success: false, error: "Error al cargar productos de la sección" }
    }
    
interface SectionProductRow {
  product_id: string
  products: {
    id: string
    tenant_id: string
    name: string
    price: number
    compare_at_price: number | null
    description: string | null
    product_images: { url: string; display_order: number }[]
    tenants: { name: string; slug: string } | null
  } | null
}

    const rows = (data || []) as unknown as SectionProductRow[]
    const products = rows
      .filter((sp) => sp.products != null)
      .map((sp) => {
        const p = sp.products!
        const images = p.product_images || []
        return {
          id: p.id,
          tenant_id: p.tenant_id,
          name: p.name,
          price: p.price,
          compare_at_price: p.compare_at_price,
          image_urls: [...images].sort((a, b) => a.display_order - b.display_order).map(i => i.url),
          description: p.description,
          tenant_name: p.tenants?.name || null,
          tenant_slug: p.tenants?.slug || null,
        }
      })
    
    return { success: true, data: products }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

// ─── Tenant sections ─────────────────────────────

export async function getTenantSections(tenantId: string): Promise<ActionResult<Section[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("display_order")
    
    if (error) {
      console.error("getTenantSections:", error)
      return { success: false, error: "Error al cargar secciones" }
    }
    return { success: true, data: data as Section[] }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

// ─── Admin CRUD ──────────────────────────────────

export async function getAllSections(tenantId?: string | null): Promise<ActionResult<Section[]>> {
  try {
    const supabase = await createClient()
    let query = supabase.from("sections").select("*")
    
    if (tenantId) query = query.eq("tenant_id", tenantId)
    else query = query.is("tenant_id", null)
    
    const { data, error } = await query.order("display_order")
    
    if (error) {
      console.error("getAllSections:", error)
      return { success: false, error: "Error al cargar secciones" }
    }
    return { success: true, data: data as Section[] }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function createSection(
  name: string,
  slug: string,
  tenantId?: string | null,
  description?: string,
  imageUrl?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sections")
      .insert({
        name,
        slug,
        tenant_id: tenantId || null,
        description: description || null,
        image_url: imageUrl || null,
      })
      .select("id")
      .single()
    
    if (error) {
      console.error("createSection:", error)
      return { success: false, error: "Error al crear sección" }
    }
    
    revalidatePath("/dashboard/admin/sections")
    return { success: true, data: { id: data.id } }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function updateSection(
  id: string,
  updates: Partial<Pick<Section, "name" | "slug" | "description" | "image_url" | "display_order" | "is_active">>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("sections")
      .update(updates)
      .eq("id", id)
    
    if (error) {
      console.error("updateSection:", error)
      return { success: false, error: "Error al actualizar sección" }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function deleteSection(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("sections")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("deleteSection:", error)
      return { success: false, error: "Error al eliminar sección" }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

// ─── Section Products ─────────────────────────────

export async function addProductToSection(sectionId: string, productId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("section_products")
      .insert({ section_id: sectionId, product_id: productId })
    
    if (error) {
      console.error("addProductToSection:", error)
      return { success: false, error: "Error al agregar producto" }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function removeProductFromSection(sectionId: string, productId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("section_products")
      .delete()
      .eq("section_id", sectionId)
      .eq("product_id", productId)
    
    if (error) {
      console.error("removeProductFromSection:", error)
      return { success: false, error: "Error al quitar producto" }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}

export async function reorderSectionProducts(
  sectionId: string,
  productIds: string[]
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    for (let i = 0; i < productIds.length; i++) {
      const { error } = await supabase
        .from("section_products")
        .update({ display_order: i })
        .eq("section_id", sectionId)
        .eq("product_id", productIds[i])
      
      if (error) console.error("reorderSectionProducts:", error)
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: "Error inesperado" }
  }
}