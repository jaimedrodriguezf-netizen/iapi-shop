"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantSubscription } from "@/lib/tenants/actions";

export interface Product {
  id: string;
  tenant_id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  is_active: boolean;
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
  image_urls?: string[]; // Hasta 3 fotos
  tags?: string[]; // IDs de tags existentes
};

export async function checkProductLimit(tenant_id: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

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

    // Check product limit before creating
    const limitCheck = await checkProductLimit(input.tenant_id);
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.error || "Límite de productos alcanzado" };
    }

    const slug = input.slug || input.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    const category_id = input.category_id || null;

    // 1. Insertar Producto
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        tenant_id: input.tenant_id,
        category_id,
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // 2. Insertar Imágenes (máximo 6 según límite de plan)
    if (input.image_urls && input.image_urls.length > 0) {
      const imagesToInsert = input.image_urls.slice(0, 6).map((url, index) => ({
        product_id: product.id,
        url,
        display_order: index,
      }));
      await supabase.from("product_images").insert(imagesToInsert);
    }

    // 3. Vincular Tags
    if (input.tags && input.tags.length > 0) {
      const tagsToInsert = input.tags.map(tagId => ({
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

    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories(name), product_images(url, display_order)")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
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

    const slug = input.name ? (input.slug || input.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")) : undefined;

    const category_id = input.category_id === "" ? null : input.category_id;

    const { data: product, error } = await supabase
      .from("products")
      .update({
        category_id,
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
      })
      .eq("id", id)
      .eq("tenant_id", tenant_id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Actualizar imágenes (simplificado: borrar y re-insertar, máx 6)
    if (input.image_urls) {
      await supabase.from("product_images").delete().eq("product_id", id);
      const imagesToInsert = input.image_urls.slice(0, 6).map((url, index) => ({
        product_id: id,
        url,
        display_order: index,
      }));
      await supabase.from("product_images").insert(imagesToInsert);
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

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant_id);
    
    if (error) return { success: false, error: error.message };
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

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant_id)
      .order("name");
    
    if (error) return { success: false, error: error.message };
    return { success: true, categories: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener categorías";
    return { success: false, error: msg };
  }
}

export async function createCategory(tenant_id: string, name: string, parent_id?: string | null): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const platformRole = user.email?.endsWith("@iapi.shop") ? "admin" : "merchant";

    // 1. Subscription plan check (only for merchants)
    if (platformRole !== "admin") {
      const { data: sub } = await supabase
        .from("tenant_subscriptions")
        .select("plans(name)")
        .eq("tenant_id", tenant_id)
        .maybeSingle();

      const subTyped = sub as { plans: { name: string } | null } | null;
      const planName = subTyped?.plans?.name || "Free";
      if (planName.toLowerCase() === "free") {
        return { success: false, error: "Tu plan no permite crear categorías." };
      }
    }

    // 2. Hierarchy and tenant isolation validation
    if (parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", parent_id)
        .eq("tenant_id", tenant_id)
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

    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ tenant_id, name, slug, parent_id: parent_id || null })
      .select()
      .single();
    
    if (error) return { success: false, error: error.message };
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

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("tenant_id", tenant_id)
      .order("name");
    
    if (error) return { success: false, error: error.message };
    return { success: true, tags: data || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener etiquetas";
    return { success: false, error: msg };
  }
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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExt = file.name.split('.').pop() || "png";
    const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error, falling back to base64:", error);
      const base64Data = buffer.toString("base64");
      const base64Url = `data:${file.type};base64,${base64Data}`;
      return { success: true, url: base64Url, fallback: true };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al subir imagen en el servidor";
    console.error("Upload server action error:", msg);
    return { success: false, error: msg };
  }
}
