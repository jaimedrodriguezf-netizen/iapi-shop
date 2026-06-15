import { createClient } from "@/lib/supabase/server"
import { getPromoBanners } from "@/lib/admin/banner-actions"
import { getMarketplaceSections } from "@/lib/sections/actions"
import { MarketplacePage } from "@/components/landing/marketplace-page"

/** Row shape returned by Supabase when selecting products with joined relations */
interface MarketplaceProductRow {
  id: string
  name: string
  price: number
  compare_at_price: number | null
  category_id: string | null
  categories: { name: string } | null
  product_images: { url: string; display_order: number }[] | null
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch site settings (logo, name)
  const { data: settings } = await supabase
    .from("site_settings")
    .select("logo_url, site_name")
    .limit(1)
    .maybeSingle()

  const siteLogo = settings?.logo_url || null
  const siteName = settings?.site_name || "IAPI Shop"

  // Fetch active promo banners
  const bannersResult = await getPromoBanners()
  const banners = bannersResult.success && bannersResult.data ? bannersResult.data : []

  // Fetch marketplace sections (tenant_id = null = global)
  const sectionsResult = await getMarketplaceSections()
  const marketplaceSections = sectionsResult.success && sectionsResult.data ? sectionsResult.data : []

  // Fetch products from all active tenants (RLS enforces tenant status)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, compare_at_price, category_id, categories(name), product_images(url, display_order)")
    .eq("is_active", true)
    .eq("approved_for_marketplace", true)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch categories from tenants that have approved marketplace products
  const { data: activeTenantIds } = await supabase
    .from("products")
    .select("tenant_id")
    .eq("is_active", true)
    .eq("approved_for_marketplace", true)

  const tenantIds = [...new Set((activeTenantIds || []).map(p => p.tenant_id))]

  const { data: allCategories } = tenantIds.length > 0
    ? await supabase
        .from("categories")
        .select("id, name, parent_id")
        .in("tenant_id", tenantIds)
        .order("name")
    : { data: [] }

  const allMarketplaceCategories: { id: string; name: string; parent_id: string | null }[] = (allCategories || []).map(c => ({
    id: c.id,
    name: c.name,
    parent_id: c.parent_id || null,
  }))

  const mappedProducts = (products as unknown as MarketplaceProductRow[] || []).map((p) => {
    const images = p.product_images ?? []
    const image_urls = [...images]
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => img.url)
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      compare_at_price: p.compare_at_price,
      image_urls,
      category_name: p.categories?.name || null,
      category_id: p.category_id || null,
    }
  })

  // Get tenant count for stats
  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  // Check if user has tenants (to decide profile vs dashboard link)
  let hasTenant = false
  let canCreateStore = false
  let tenantSlug: string | undefined
  const userEmail = user?.email || ""
  let avatarUrl: string | null = null
  if (user) {
    // Try user metadata first (Google OAuth)
    avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    // Fallback to profiles table
    if (!avatarUrl) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
      avatarUrl = profile?.avatar_url || null
    }
  }
  if (user) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("created_by", user.id)
      .limit(1)
      .maybeSingle()
    hasTenant = !!tenant

    // Check if user can create a store
    const { data: existingTenants } = await supabase
      .from("tenants")
      .select("id")
      .eq("created_by", user.id)
    const existingTenantsList = existingTenants ?? []
    const userTenantCount = existingTenantsList.length

    if (userTenantCount === 0) {
      canCreateStore = true // first store is always free
    } else {
      // Check if any tenant has plus plan
      const userTenantIds = existingTenantsList.map(t => t.id)
      const { data: subs } = await supabase
        .from("tenant_subscriptions")
        .select("plans(code)")
        .in("tenant_id", userTenantIds)
        .eq("status", "active")
      canCreateStore = subs?.some((s: Record<string, unknown>) => (s.plans as Record<string, unknown>)?.code === "plus") || false
    }

    // Get tenant slug for "Mi Tienda" link
    if (hasTenant) {
      const { data: firstTenant } = await supabase
        .from("tenants")
        .select("slug")
        .eq("created_by", user.id)
        .limit(1)
        .maybeSingle()
      tenantSlug = firstTenant?.slug ?? undefined
    }
  }

  return (
    <MarketplacePage
      siteLogo={siteLogo}
      siteName={siteName}
      banners={banners}
      products={mappedProducts}
      tenantCount={tenantCount ?? 0}
      categories={allMarketplaceCategories}
      sections={marketplaceSections}
      isAuthenticated={!!user}
      hasTenant={hasTenant}
      userEmail={userEmail}
      canCreateStore={canCreateStore}
      tenantSlug={tenantSlug}
      avatarUrl={avatarUrl}
    />
  )
}