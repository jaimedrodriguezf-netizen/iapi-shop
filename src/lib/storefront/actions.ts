"use server";

import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface StorefrontData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    brand_color?: string;
    secondary_color?: string;
    whatsapp_phone?: string;
    logo_url?: string;
    address?: string;
    city?: string | null;
    province?: string | null;
    status: string;
    social_links?: {
      instagram?: string;
      facebook?: string;
      tiktok?: string;
    } | null;
  };
  categories: {
    id: string;
    name: string;
    tenant_id: string;
  }[];
  products: {
    id: string;
    name: string;
    price: number;
    image_urls?: string[];
    category_id?: string;
    description?: string;
  }[];
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tenant?: StorefrontData["tenant"];
  categories?: StorefrontData["categories"];
  products?: StorefrontData["products"];
}

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// Caching function wrapped inside the Server Action file
const fetchStorefrontDataCached = cache(async (slug: string): Promise<ActionResult<StorefrontData>> => {
  try {
    const supabase = await createClient();

    // 1. Obtener el Tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (tenantError || !tenant || tenant.status !== "active") {
      return { success: false, error: "Sucursal no encontrada o inactiva" };
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
      tenant: tenant as unknown as StorefrontData["tenant"], 
      categories: (categories || []) as unknown as StorefrontData["categories"], 
      products: (products || []) as unknown as StorefrontData["products"] 
    };
  } catch (error) {
    console.error("Storefront Fetch Error:", error);
    return { success: false, error: "Error inesperado al cargar la sucursal" };
  }
});

export async function getStorefrontData(slug: string): Promise<ActionResult<StorefrontData>> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    return { success: false, error: "Formato de sucursal inválido" };
  }
  return fetchStorefrontDataCached(parsed.data);
}
