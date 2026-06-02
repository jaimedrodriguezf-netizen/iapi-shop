"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function createProduct(input: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const slug = input.slug || input.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    // 1. Insertar Producto
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        tenant_id: input.tenant_id,
        category_id: input.category_id,
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // 2. Insertar Imágenes (máximo 3)
    if (input.image_urls && input.image_urls.length > 0) {
      const imagesToInsert = input.image_urls.slice(0, 3).map((url, index) => ({
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
      .select("*, categories(name)")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, products: products as (Product & { categories?: { name: string } | null })[] };
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

    const { data: product, error } = await supabase
      .from("products")
      .update({
        category_id: input.category_id,
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

    // Actualizar imágenes (simplificado: borrar y re-insertar)
    if (input.image_urls) {
      await supabase.from("product_images").delete().eq("product_id", id);
      const imagesToInsert = input.image_urls.slice(0, 3).map((url, index) => ({
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

export async function createCategory(tenant_id: string, name: string): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "No autorizado" };
    }

    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ tenant_id, name, slug })
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
