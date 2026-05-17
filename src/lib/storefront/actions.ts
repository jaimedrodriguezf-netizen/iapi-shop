"use server";

import { createClient } from "@/lib/supabase/server";

export async function getStorefrontData(slug: string) {
  try {
    const supabase = await createClient();

    // 1. Obtener el Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Sucursal no encontrada" };
    }

    // 2. Obtener Categorías
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("name");

    // 3. Obtener Productos Activos
    const { data: products } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return { 
      success: true, 
      tenant, 
      categories: categories || [], 
      products: products || [] 
    };
  } catch (error) {
    console.error("Storefront Fetch Error:", error);
    return { success: false, error: "Error inesperado al cargar la sucursal" };
  }
}
