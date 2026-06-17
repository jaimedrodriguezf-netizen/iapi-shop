"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FavoriteActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: "AUTH_REQUIRED" | "PRODUCT_NOT_FOUND" | "TENANT_MISMATCH";
}

export interface FavoriteStats {
  totalFavorites: number;
  thisWeekFavorites: number;
  mostFavorited: { product_id: string; product_name: string; favorite_count: number }[];
  favoritesByDay: { date: string; count: number }[];
}

/**
 * Toggle a product as favorite. If already favorited, removes it.
 * Requires authentication.
 */
export async function toggleFavorite(
  productId: string,
  tenantId: string
): Promise<FavoriteActionResult<{ isFavorited: boolean }>> {
  try {
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();
    let userId = claimsData?.claims?.sub as string | undefined;

    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "Inicia sesion para guardar favoritos", errorCode: "AUTH_REQUIRED" };
      }
      userId = user.id;
    }

    const { data: product } = await supabase
      .from("products")
      .select("id, tenant_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return { success: false, error: "Producto no encontrado", errorCode: "PRODUCT_NOT_FOUND" };
    }
    if (product.tenant_id !== tenantId) {
      return { success: false, error: "El producto no pertenece a esta tienda", errorCode: "TENANT_MISMATCH" };
    }

    const { data: deleted } = await supabase
      .from("product_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId)
      .select("id");

    if (deleted && deleted.length > 0) {
      revalidatePath("/perfil");
      revalidatePath("/", "layout");
      return { success: true, data: { isFavorited: false } };
    }

    const { error: insError } = await supabase
      .from("product_favorites")
      .insert({
        user_id: userId,
        product_id: productId,
        tenant_id: tenantId,
      });

    if (insError) {
      if (insError.code === "23505") {
        revalidatePath("/perfil");
        revalidatePath("/", "layout");
        return { success: true, data: { isFavorited: true } };
      }
      console.error("toggleFavorite insert error:", insError);
      return { success: false, error: "Error al agregar favorito" };
    }

    revalidatePath("/perfil");
    revalidatePath("/", "layout");
    return { success: true, data: { isFavorited: true } };
  } catch (err) {
    console.error("toggleFavorite error:", err);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Get the authenticated user's favorited product IDs for a tenant.
 */
export async function getMyFavoriteIds(
  tenantId: string
): Promise<FavoriteActionResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    let userId = claimsData?.claims?.sub as string | undefined;
    if (!userId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: true, data: [] };
      }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from("product_favorites")
      .select("product_id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("getMyFavoriteIds error:", error);
      return { success: false, error: "Error al obtener favoritos" };
    }

    return { success: true, data: (data || []).map(f => f.product_id) };
  } catch (err) {
    console.error("getMyFavoriteIds error:", err);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Get favorites count for a specific product.
 */
export async function getProductFavoriteCount(
  productId: string
): Promise<FavoriteActionResult<number>> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("product_favorites")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId);

    if (error) {
      return { success: false, error: "Error al obtener conteo de favoritos" };
    }

    return { success: true, data: count ?? 0 };
  } catch (err) {
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Get favorite statistics for a tenant (for dashboard).
 * Requires tenant membership.
 */
export async function getTenantFavoriteStats(
  tenantId: string
): Promise<FavoriteActionResult<FavoriteStats>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Verify tenant membership
    const { data: member } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return { success: false, error: "No autorizado" };
    }

    // Total favorites
    const { count: totalFavorites } = await supabase
      .from("product_favorites")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    // This week favorites
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const { count: thisWeekFavorites } = await supabase
      .from("product_favorites")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", oneWeekAgo.toISOString());

    // Get most favorited products (top 10) by manual aggregation
    const { data: allFavorites } = await supabase
      .from("product_favorites")
      .select("product_id, products(name)")
      .eq("tenant_id", tenantId);

    const productCounts = new Map<string, { count: number; name: string }>();
    for (const fav of allFavorites || []) {
      const prod = fav.products as unknown as { name: string } | null;
      const existing = productCounts.get(fav.product_id);
      if (existing) {
        existing.count++;
      } else {
        productCounts.set(fav.product_id, { count: 1, name: prod?.name || "Desconocido" });
      }
    }

    const mostFavoritedList = Array.from(productCounts.entries())
      .map(([product_id, data]) => ({
        product_id,
        product_name: data.name,
        favorite_count: data.count,
      }))
      .sort((a, b) => b.favorite_count - a.favorite_count)
      .slice(0, 10);

    // Favorites by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentFavorites } = await supabase
      .from("product_favorites")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at");

    const dailyCounts = new Map<string, number>();
    for (const fav of recentFavorites || []) {
      const day = fav.created_at.split("T")[0];
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    }

    const favoritesByDay = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: true,
      data: {
        totalFavorites: totalFavorites ?? 0,
        thisWeekFavorites: thisWeekFavorites ?? 0,
        mostFavorited: mostFavoritedList,
        favoritesByDay,
      },
    };
  } catch (err) {
    console.error("getTenantFavoriteStats error:", err);
    return { success: false, error: "Error al obtener estadísticas de favoritos" };
  }
}