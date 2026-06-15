-- Migration: Public Storefront RLS
-- Add SELECT policies for anonymous (anon) role so that
-- public storefront pages load without authentication.
-- Only active tenants and their products/categories are exposed.
-- Internal tables (profiles, platform_admins, audit_logs, members, payments)
-- remain restricted to authenticated + appropriate roles.

-- ============================================
-- Tenants — public visitors can read active tenants
-- ============================================
create policy "tenants_select_public_active" on public.tenants
  for select to anon
  using (status = 'active');

-- ============================================
-- Products — public visitors can read active products of active tenants
-- ============================================
create policy "products_select_public_active" on public.products
  for select to anon
  using (
    is_active = true
    and exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and t.status = 'active'
    )
  );

-- ============================================
-- Categories — public visitors can read categories of active tenants
-- ============================================
create policy "categories_select_public_active" on public.categories
  for select to anon
  using (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and t.status = 'active'
    )
  );

-- ============================================
-- Product Images — public visitors can read images of active products
-- ============================================
create policy "product_images_select_public_active" on public.product_images
  for select to anon
  using (
    exists (
      select 1 from public.products p
      join public.tenants t on t.id = p.tenant_id
      where p.id = product_id
        and p.is_active = true
        and t.status = 'active'
    )
  );

-- ============================================
-- Tenant Subscriptions — public visitors can read active subscriptions
-- (needed for storefront to determine plan name)
-- ============================================
create policy "tenant_subscriptions_select_public_active" on public.tenant_subscriptions
  for select to anon
  using (status = 'active');
