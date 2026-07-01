-- Migration: Restrict product catalog RLS to specific roles
-- viewer and sales should NOT be able to insert/update/delete products, categories, or tags

-- ============================================
-- Categories
-- ============================================
drop policy if exists "categories_insert_member" on public.categories;
drop policy if exists "categories_update_member" on public.categories;
drop policy if exists "categories_delete_member" on public.categories;

create policy "categories_insert_editor" on public.categories
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "categories_update_editor" on public.categories
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "categories_delete_admin" on public.categories
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

-- ============================================
-- Tags
-- ============================================
drop policy if exists "tags_insert_member" on public.tags;
drop policy if exists "tags_update_member" on public.tags;
drop policy if exists "tags_delete_member" on public.tags;

create policy "tags_insert_editor" on public.tags
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "tags_update_editor" on public.tags
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "tags_delete_admin" on public.tags
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

-- ============================================
-- Products
-- ============================================
drop policy if exists "products_insert_member" on public.products;
drop policy if exists "products_update_member" on public.products;
drop policy if exists "products_delete_member" on public.products;

create policy "products_insert_editor" on public.products
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "products_update_editor" on public.products
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','admin','inventory']::public.tenant_role[]));

create policy "products_delete_admin" on public.products
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

-- ============================================
-- Product Images
-- ============================================
drop policy if exists "product_images_insert_member" on public.product_images;
drop policy if exists "product_images_delete_member" on public.product_images;

create policy "product_images_insert_editor" on public.product_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id, array['owner','admin','inventory']::public.tenant_role[])
    )
  );

create policy "product_images_delete_admin" on public.product_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id, array['owner','admin']::public.tenant_role[])
    )
  );

-- ============================================
-- Product Tags
-- ============================================
drop policy if exists "product_tags_insert_member" on public.product_tags;
drop policy if exists "product_tags_delete_member" on public.product_tags;

create policy "product_tags_insert_editor" on public.product_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id, array['owner','admin','inventory']::public.tenant_role[])
    )
  );

create policy "product_tags_delete_admin" on public.product_tags
  for delete to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id, array['owner','admin']::public.tenant_role[])
    )
  );
