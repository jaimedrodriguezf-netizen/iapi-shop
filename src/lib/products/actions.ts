"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTenantSubscription } from "@/lib/tenants/actions";
import { isPlatformAdmin } from "@/lib/auth/platform-admins";
import { assertTenantMember } from "@/lib/auth/guards";
import { uploadRateLimit, productRateLimit, categoryRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications/actions";

export interface Product {
  id: string;
  tenant_id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  is_active: boolean;
  approved_for_marketplace?: boolean;
  image_urls?: string[] | null;
  created_at?: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export type CreateProductInput = {
  tenant_id: string;
  category_id?: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  image_urls?: string[]; // Hasta 3 fotos
  tags?: string[]; // IDs de tags existentes
};

const createProductSchema = z.object({
  tenant_id: z.string().uuid("ID de sucursal inválido"),
  category_id: z.string().uuid("ID de categoría inválido").optional(),
  name: z.string().min(1, "El nombre es requerido").max(200, "El nombre no puede exceder 200 caracteres"),
  slug: z.string().max(200).optional(),
  description: z.string().max(2000, "La descripción no puede exceder 2000 caracteres").optional(),
  price: z.number().min(0, "El precio no puede ser negativo"),
  compare_at_price: z.number().min(0).nullable().optional(),
  image_urls: z.array(z.string()).max(6, "Máximo 6 imágenes permitidas").optional(),
  tags: z.array(z.string().uuid()).optional(),
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  tenant_id: z.string().uuid("ID de sucursal inválido"),
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
  parent_id: z.string().uuid().nullable().optional(),
});

export async function checkProductLimit(tenant_id: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Auth guard
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { allowed: false, current: 0, limit: 0, error: "No autorizado" };
    }

    // Tenant membership guard
    const membership = await assertTenantMember(supabase, tenant_id);
    if (!membership.ok) {
      return { allowed: false, current: 0, limit: 0, error: membership.error };
    }

    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant_id);

    if (countError) {
      return { allowed: false, current: 0, limit: 0, error: "Error al verificar límite de productos" };
    }

    const current = count ?? 0;

    const subResult = await getTenantSubscription(tenant_id);
    if (!subResult.success || !subResult.data?.plans) {
      return { allowed: false, current, limit: 0, error: "No se pudo obtener el plan de suscripción" };
    }

    const limit = subResult.data.plans.product_limit;

    if (current >= limit) {
      return { allowed: false, current, limit, error: `Has alcanzado el límite de ${limit} productos para tu plan actual.` };
    }

    return { allowed: true, current, limit };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al verificar límite de productos";
    return { allowed: false, current: 0, limit: 0, error: msg };
  }
}

export async function createProduct(input: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const membership = await assertTenantMember(supabase, input.tenant_id);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    // Rate limiting
    const productIp = await getClientIdentifier();
    const { success: rateLimitOk } = await productRateLimit.limit(productIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
    }

// Zod validation (preprocess: convert empty string category_id to undefined for form convention)
    const preprocessed = { ...input };
    if (preprocessed.category_id === "") {
      preprocessed.category_id = undefined;
    }
    const parsed = createProductSchema.safeParse(preprocessed);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    // Check product limit before creating
    const limitCheck = await checkProductLimit(parsed.data.tenant_id);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error || "Límite de productos alcanzado" };
    }

    const slug = parsed.data.slug || parsed.data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    const category_id = input.category_id === "" ? null : (parsed.data.category_id || null);

    // 1. Insertar Producto
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        tenant_id: parsed.data.tenant_id,
        category_id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        price: parsed.data.price,
        compare_at_price: parsed.data.compare_at_price ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("createProduct:", error);
      return { success: false, error: "Error al procesar los productos" };
    }

    // 2. Insertar Imágenes (máximo 6 según límite de plan)
    if (parsed.data.image_urls && parsed.data.image_urls.length > 0) {
      const imagesToInsert = parsed.data.image_urls.slice(0, 6).map((url, index) => ({
        product_id: product.id,
        url,
        display_order: index,
      }));
      const { error: imagesError } = await supabase.from("product_images").insert(imagesToInsert);
      if (imagesError) {
        console.error("Error al insertar imágenes del producto:", imagesError);
        return { success: false, error: "Error al guardar las imágenes del producto. Intenta de nuevo." };
      }
    }

    // 3. Vincular Tags
    if (parsed.data.tags && parsed.data.tags.length > 0) {
      const tagsToInsert = parsed.data.tags.map(tagId => ({
        product_id: product.id,
        tag_id: tagId,
      }));
      await supabase.from("product_tags").insert(tagsToInsert);
    }

    return { success: true, product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear producto";
    return { success: false, error: msg };
  }
}

export async function getProducts(tenant_id: string): Promise<{ success: boolean; products?: (Product & { categories?: { name: string } | null })[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const membership = await assertTenantMember(supabase, tenant_id);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(name), product_images(url, display_order)")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getProducts:", error);
      return { success: false, error: "Error al procesar los productos" };
    }

    const formattedProducts = (products || []).map(p => {
      const images = p.product_images as { url: string; display_order: number }[] | undefined;
      const image_urls = images
        ? [...images].sort((a, b) => a.display_order - b.display_order).map(img => img.url)
        : [];
      return {
        ...p,
        image_urls,
      };
    });

    return { success: true, products: formattedProducts as (Product & { categories?: { name: string } | null })[] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener productos";
    return { success: false, error: msg };
  }
}

export async function updateProduct(id: string, tenant_id: string, input: Partial<CreateProductInput>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    // Zod validation (preprocess: convert empty string category_id to undefined for form convention)
    const preprocessed = { ...input };
    if (preprocessed.category_id === "") {
      preprocessed.category_id = undefined;
    }
    const parsed = updateProductSchema.safeParse(preprocessed);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const slug = parsed.data.name ? (parsed.data.slug || parsed.data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")) : undefined;

    const category_id = input.category_id === "" ? null : parsed.data.category_id;

    const { data: product, error } = await supabase
      .from("products")
      .update({
        category_id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        price: parsed.data.price,
        compare_at_price: parsed.data.compare_at_price,
      })
      .eq("id", id)
      .eq("tenant_id", tenant_id)
      .select()
      .single();

    if (error) {
      console.error("updateProduct:", error);
      return { success: false, error: "Error al procesar los productos" };
    }

    // Actualizar imágenes (simplificado: borrar y re-insertar, máx 6)
    if (parsed.data.image_urls) {
      const { error: deleteError } = await supabase.from("product_images").delete().eq("product_id", id);
      if (deleteError) {
        console.error("Error al eliminar imágenes previas:", deleteError);
        return { success: false, error: "Error al actualizar las imágenes. Intenta de nuevo." };
      }
      const imagesToInsert = parsed.data.image_urls.slice(0, 6).map((url, index) => ({
        product_id: id,
        url,
        display_order: index,
      }));
      const { error: insertError } = await supabase.from("product_images").insert(imagesToInsert);
      if (insertError) {
        console.error("Error al insertar nuevas imágenes:", insertError);
        return { success: false, error: "Error al guardar las nuevas imágenes. Intenta de nuevo." };
      }
    }

    // Price drop notification: if the price decreased, notify users who favorited this product
    const newPrice = parsed.data.price;
    if (newPrice !== undefined) {
      const { data: previousProduct } = await supabase
        .from("products")
        .select("price, name")
        .eq("id", id)
        .single();

      const oldPrice = previousProduct?.price as number | undefined;

      if (oldPrice !== undefined && oldPrice > newPrice) {
        const { data: favorites } = await supabase
          .from("product_favorites")
          .select("user_id")
          .eq("product_id", id);

        const favoriters = favorites as { user_id: string }[] | null;

        if (favoriters && favoriters.length > 0) {
          const dropPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
          const productName = parsed.data.name ?? (previousProduct?.name as string | undefined) ?? "Producto";

          for (const fav of favoriters) {
            await createNotification(
              fav.user_id,
              "price_drop",
              `¡Bajó de precio! ${productName}`,
              `De $${oldPrice.toFixed(2)} a $${newPrice.toFixed(2)} (-${dropPercent}%). ¡Aprovechá!`,
              `/dashboard/products`
            );
          }
        }
      }
    }

    return { success: true, product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar producto";
    return { success: false, error: msg };
  }
}

export async function deleteProduct(id: string, tenant_id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const membership = await assertTenantMember(supabase, tenant_id);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant_id);
    
    if (error) {
      console.error("deleteProduct:", error);
      return { success: false, error: "Error al procesar los productos" };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar producto";
    return { success: false, error: msg };
  }
}

export async function getCategories(tenant_id: string): Promise<{ success: boolean; categories?: Category[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const membership = await assertTenantMember(supabase, tenant_id);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or(`tenant_id.eq.${tenant_id},tenant_id.is.null`)
      .order("name");
    
    if (error) {
      console.error("getCategories:", error);
      return { success: false, error: "Error al procesar los productos" };
    }
    return { success: true, categories: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener categorías";
    return { success: false, error: msg };
  }
}

export async function createCategory(tenant_id: string, name: string, parent_id?: string | null): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    // Zod validation
    const parsed = createCategorySchema.safeParse({ tenant_id, name, parent_id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    // Rate limiting
    const catIp = await getClientIdentifier();
    const { success: rateLimitOk } = await categoryRateLimit.limit(catIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
    }

    const isAdmin = await isPlatformAdmin(user.id, user.email);
    const platformRole = isAdmin ? "admin" : "merchant";

    // 1. Subscription plan check (only for merchants)
    if (platformRole !== "admin") {
      const { data: sub } = await supabase
        .from("tenant_subscriptions")
        .select("plans(name)")
        .eq("tenant_id", parsed.data.tenant_id)
        .maybeSingle();

      const subTyped = sub as { plans: { name: string } | null } | null;
      const planName = subTyped?.plans?.name || "Free";
      if (planName.toLowerCase() === "free") {
        return { success: false, error: "Tu plan no permite crear categorías." };
      }
    }

    // 2. Hierarchy and tenant isolation validation
    if (parsed.data.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", parsed.data.parent_id)
        .eq("tenant_id", parsed.data.tenant_id)
        .maybeSingle();

      if (parentError || !parentCategory) {
        return { success: false, error: "La categoría padre especificada no existe." };
      }

      // If parent has a parent_id, it is a Level 2 category.
      // We must fetch its parent (grandparent) to ensure we do not exceed 3 levels (grandparent must be Level 1, having parent_id = null).
      if (parentCategory.parent_id) {
        const { data: grandParentCategory, error: gpError } = await supabase
          .from("categories")
          .select("id, parent_id")
          .eq("id", parentCategory.parent_id)
          .eq("tenant_id", tenant_id)
          .maybeSingle();

        if (gpError || !grandParentCategory) {
          return { success: false, error: "La categoría padre de segundo nivel no existe." };
        }

        if (grandParentCategory.parent_id) {
          return { success: false, error: "No se puede agregar una categoría en este nivel (límite de 3 niveles jerárquicos)." };
        }
      }
    }

    const slug = parsed.data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ tenant_id: parsed.data.tenant_id, name: parsed.data.name, slug, parent_id: parsed.data.parent_id || null })
      .select()
      .single();
    
    if (error) {
      console.error("createCategory:", error);
      return { success: false, error: "Error al procesar los productos" };
    }
    return { success: true, category: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al crear categoría";
    return { success: false, error: msg };
  }
}

export async function getTags(tenant_id: string): Promise<{ success: boolean; tags?: Tag[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const membership = await assertTenantMember(supabase, tenant_id);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("tenant_id", tenant_id)
      .order("name");
    
    if (error) {
      console.error("getTags:", error);
      return { success: false, error: "Error al procesar los productos" };
    }
    return { success: true, tags: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener etiquetas";
    return { success: false, error: msg };
  }
}

/**
 * Detects the actual MIME type of a file by inspecting its magic bytes.
 * Returns null if the bytes don't match any known image format.
 */
function getMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function uploadProductImage(formData: FormData): Promise<{ success: boolean; url?: string; fallback?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const file = formData.get("file") as File;
    const tenantId = formData.get("tenantId") as string;
    if (!file || !tenantId) {
      return { success: false, error: "Archivo o sucursal no válidos" };
    }

    // Validate file type (first-pass filter, defense in depth)
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    const fileType = file.type;
    if (!allowedTypes.includes(fileType)) {
      return { success: false, error: "Tipo de archivo no permitido. Usa PNG, JPEG, GIF o WebP." };
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: "El archivo no puede exceder 5MB." };
    }

    // Validate tenantId format
    if (!z.string().uuid().safeParse(tenantId).success) {
      return { success: false, error: "ID de sucursal inválido" };
    }

    // Rate limiting
    const clientIp = await getClientIdentifier();
    const { success: rateLimitOk } = await uploadRateLimit.limit(clientIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiadas subidas. Intenta de nuevo en un minuto." };
    }

    // Tenant membership guard (Task 2.1)
    const membership = await assertTenantMember(supabase, tenantId);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Magic byte validation (Task 2.2)
    const detectedMime = getMagicBytes(buffer);
    if (!detectedMime) {
      return { success: false, error: "No se pudo verificar el tipo de archivo." };
    }
    if (!allowedTypes.includes(detectedMime)) {
      return { success: false, error: "Tipo de archivo no permitido. Usa PNG, JPEG, GIF o WebP." };
    }
    if (detectedMime !== fileType) {
      return { success: false, error: "El tipo de archivo no coincide con su contenido." };
    }

    const fileExt = file.name.split('.').pop() || "png";
    const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: detectedMime,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: "Error al subir la imagen. Intenta de nuevo." };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    console.error("Upload server action error:", err);
    return { success: false, error: "Error al procesar la solicitud" };
  }
}

export async function requestMarketplaceApproval(
  productId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  "use server"

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const membership = await assertTenantMember(supabase, tenantId)
    if (!membership.ok) return { success: false, error: membership.error }

    const { data: product } = await supabase
      .from("products")
      .select("id, marketplace_status")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .single()

    if (!product) return { success: false, error: "Producto no encontrado" }
    if (product.marketplace_status === "pending") return { success: false, error: "El producto ya está pendiente de revisión" }
    if (product.marketplace_status === "approved") return { success: false, error: "El producto ya fue aprobado" }

    const { error } = await supabase
      .from("products")
      .update({ marketplace_status: "pending" })
      .eq("id", productId)

    if (error) {
      console.error("requestMarketplaceApproval:", error)
      return { success: false, error: "Error al solicitar publicación" }
    }

    return { success: true }
  } catch (err) {
    console.error("requestMarketplaceApproval error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function reviewMarketplaceProduct(
  productId: string,
  action: "approve" | "reject",
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  "use server"

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const isAdmin = await isPlatformAdmin(user.id, user.email)
    if (!isAdmin) return { success: false, error: "Solo administradores pueden revisar productos" }

    const { data: product } = await supabase
      .from("products")
      .select("id, marketplace_status, tenant_id")
      .eq("id", productId)
      .single()

    if (!product) return { success: false, error: "Producto no encontrado" }
    if (product.marketplace_status !== "pending") return { success: false, error: "El producto no está pendiente de revisión" }

    const newStatus = action === "approve" ? "approved" : "rejected"
    const updates: Record<string, unknown> = {
      marketplace_status: newStatus,
      approved_for_marketplace: action === "approve",
    }
    if (action === "reject" && reason) {
      updates.marketplace_rejection_reason = reason
    }

    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)

    if (error) {
      console.error("reviewMarketplaceProduct:", error)
      return { success: false, error: "Error al revisar el producto" }
    }

    return { success: true }
  } catch (err) {
    console.error("reviewMarketplaceProduct error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

export async function getPendingMarketplaceProducts(): Promise<{ success: boolean; data?: Array<{
  id: string
  name: string
  price: number
  tenant_id: string
  image_urls: string[]
  created_at: string
}>; error?: string }> {
  "use server"

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const isAdmin = await isPlatformAdmin(user.id, user.email)
    if (!isAdmin) return { success: false, error: "Solo administradores" }

    // Use raw SQL via rpc to bypass tenant-scoped RLS
    const { data, error } = await supabase.rpc("get_pending_marketplace_products")

    if (error) {
      // Fallback: try direct query
      const { data: fallback, error: fallbackError } = await supabase
        .from("products")
        .select("id, name, price, tenant_id, created_at, product_images(url)")
        .eq("marketplace_status", "pending")
        .order("created_at", { ascending: false })

      if (fallbackError) {
        console.error("getPendingMarketplaceProducts:", fallbackError)
        return { success: false, error: "Error al cargar productos pendientes" }
      }

      const products = (fallback || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        tenant_id: p.tenant_id,
        image_urls: (p.product_images || []).map((img: { url: string }) => img.url),
        created_at: p.created_at,
      }))
      return { success: true, data: products }
    }

    const products = (data || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      price: p.price as number,
      tenant_id: p.tenant_id as string,
      image_urls: (p.image_urls as string[]) || [],
      created_at: p.created_at as string,
    }))
    return { success: true, data: products }
  } catch (err) {
    console.error("getPendingMarketplaceProducts error:", err)
    return { success: false, error: "Error inesperado" }
  }
}

// Keep old function for backwards compat but route through new system
export async function toggleMarketplaceApproval(
  productId: string,
  _tenantId: string
): Promise<{ success: boolean; approved?: boolean; error?: string }> {
  "use server"

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const isAdmin = await isPlatformAdmin(user.id, user.email)
    if (!isAdmin) return { success: false, error: "Solo administradores pueden aprobar productos" }

    const { data: product } = await supabase
      .from("products")
      .select("id, approved_for_marketplace, marketplace_status")
      .eq("id", productId)
      .single()

    if (!product) return { success: false, error: "Producto no encontrado" }

    const newState = !product.approved_for_marketplace
    const newStatus = newState ? "approved" : "none"

    const { error } = await supabase
      .from("products")
      .update({ 
        approved_for_marketplace: newState,
        marketplace_status: newStatus as "approved" | "none"
      })
      .eq("id", productId)

    if (error) {
      console.error("toggleMarketplaceApproval:", error)
      return { success: false, error: "Error al actualizar aprobación" }
    }

    return { success: true, approved: newState }
  } catch (err) {
    console.error("toggleMarketplaceApproval error:", err)
    return { success: false, error: "Error inesperado" }
  }
}
