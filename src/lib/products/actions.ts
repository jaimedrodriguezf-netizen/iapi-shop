"use server";

import { createClient } from "@/lib/supabase/server";

export type CreateProductInput = {
  tenant_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image_urls?: string[]; // Hasta 3 fotos
  tags?: string[]; // IDs de tags existentes
};

export async function createProduct(input: CreateProductInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  // 1. Insertar Producto
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      tenant_id: input.tenant_id,
      category_id: input.category_id,
      name: input.name,
      slug: input.slug,
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
}

export async function getProducts(tenant_id: string) {
  const supabase = await createClient();
  
  const { data: products, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("tenant_id", tenant_id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, products };
}

export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .update({
      category_id: input.category_id,
      name: input.name,
      description: input.description,
      price: input.price,
    })
    .eq("id", id)
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
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  
  return { success: !error, error: error?.message };
}

export async function getCategories(tenant_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("name");
  
  return { success: !error, categories: data || [], error: error?.message };
}

export async function createCategory(tenant_id: string, name: string) {
  const supabase = await createClient();
  const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  const { data, error } = await supabase
    .from("categories")
    .insert({ tenant_id, name, slug })
    .select()
    .single();
  
  return { success: !error, category: data, error: error?.message };
}

export async function getTags(tenant_id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("name");
  
  return { success: !error, tags: data || [], error: error?.message };
}
