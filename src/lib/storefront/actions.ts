"use server";

import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/tenants/actions";

/** Row shape returned by Supabase when selecting products with joined relations */
interface StorefrontProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  is_active: boolean;
  category_id: string | null;
  categories: { name: string } | null;
  product_images: { url: string; display_order: number }[] | null;
}

export interface StorefrontData {
  tenant: Tenant;
  categories: {
    id: string;
    name: string;
    tenant_id: string;
    parent_id?: string | null;
  }[];
  products: {
    id: string;
    name: string;
    price: number;
    compare_at_price?: number;
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

    // 1. Obtener el Tenant — solo columnas públicas (sin created_by ni campos internos)
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug, status, brand_color, secondary_color, address, social_links, whatsapp_phone, logo_url, qr_code_url, public_settings, created_at")
      .eq("slug", slug)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Sucursal no encontrada" };
    }

    // 1.2 Query active subscription via restricted view (no sensitive columns exposed to anon)
    const { data: subscription } = await supabase
      .from("public_tenant_subscriptions")
      .select("plan_name")
      .eq("tenant_id", tenant.id)
      .limit(1)
      .maybeSingle();

    const planName = subscription?.plan_name ?? "Free";

    const tenantWithPlan: Tenant = { ...tenant, plan_name: planName };

    // 2. Obtener Categorías — columnas públicas
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("tenant_id", tenant.id)
      .order("name");

    // 3. Obtener Productos Activos — columnas públicas con imágenes
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, description, price, compare_at_price, is_active, category_id, categories(name), product_images(url, display_order)")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const mappedProducts = (products as unknown as StorefrontProductRow[] || []).map((p) => {
      const images = p.product_images ?? [];
      const image_urls = [...images]
        .sort((a, b) => a.display_order - b.display_order)
        .map((img) => img.url);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compare_at_price: p.compare_at_price || undefined,
        category_id: p.category_id ?? undefined,
        description: p.description ?? undefined,
        image_urls,
      };
    });

    return { 
      success: true, 
      tenant: tenantWithPlan, 
      categories: (categories || []) as unknown as StorefrontData["categories"], 
      products: mappedProducts as StorefrontData["products"]
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
