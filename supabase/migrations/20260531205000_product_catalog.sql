-- Migration: Product Catalog
-- Create categories, products, product_images, tags, and product_tags tables with RLS and indexes.
-- Must run BEFORE orders_analytics (20260531205500) which references products(id).

-- ============================================
-- Categories
-- ============================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- ============================================
-- Tags
-- ============================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- ============================================
-- Products
-- ============================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- ============================================
-- Product Images
-- ============================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

-- ============================================
-- Product Tags (join table)
-- ============================================
create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  unique (product_id, tag_id)
);

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_categories_tenant_id on public.categories(tenant_id);
create index if not exists idx_tags_tenant_id on public.tags(tenant_id);
create index if not exists idx_products_tenant_id on public.products(tenant_id);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_product_images_product_id on public.product_images(product_id);
create index if not exists idx_product_tags_product_id on public.product_tags(product_id);
create index if not exists idx_product_tags_tag_id on public.product_tags(tag_id);

-- ============================================
-- updated_at trigger for products
-- ============================================
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();

-- ============================================
-- Enable RLS
-- ============================================
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_tags enable row level security;

-- ============================================
-- RLS Policies: Categories
-- ============================================
create policy "categories_select_member" on public.categories
  for select to authenticated
  using (public.has_tenant_role(tenant_id));

create policy "categories_insert_member" on public.categories
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id));

create policy "categories_update_member" on public.categories
  for update to authenticated
  using (public.has_tenant_role(tenant_id))
  with check (public.has_tenant_role(tenant_id));

create policy "categories_delete_member" on public.categories
  for delete to authenticated
  using (public.has_tenant_role(tenant_id));

-- ============================================
-- RLS Policies: Tags
-- ============================================
create policy "tags_select_member" on public.tags
  for select to authenticated
  using (public.has_tenant_role(tenant_id));

create policy "tags_insert_member" on public.tags
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id));

create policy "tags_update_member" on public.tags
  for update to authenticated
  using (public.has_tenant_role(tenant_id))
  with check (public.has_tenant_role(tenant_id));

create policy "tags_delete_member" on public.tags
  for delete to authenticated
  using (public.has_tenant_role(tenant_id));

-- ============================================
-- RLS Policies: Products
-- ============================================
create policy "products_select_member" on public.products
  for select to authenticated
  using (public.has_tenant_role(tenant_id));

create policy "products_insert_member" on public.products
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id));

create policy "products_update_member" on public.products
  for update to authenticated
  using (public.has_tenant_role(tenant_id))
  with check (public.has_tenant_role(tenant_id));

create policy "products_delete_member" on public.products
  for delete to authenticated
  using (public.has_tenant_role(tenant_id));

-- ============================================
-- RLS Policies: Product Images
-- ============================================
create policy "product_images_select_member" on public.product_images
  for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );

create policy "product_images_insert_member" on public.product_images
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );

create policy "product_images_delete_member" on public.product_images
  for delete to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );

-- ============================================
-- RLS Policies: Product Tags
-- ============================================
create policy "product_tags_select_member" on public.product_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );

create policy "product_tags_insert_member" on public.product_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );

create policy "product_tags_delete_member" on public.product_tags
  for delete to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and public.has_tenant_role(p.tenant_id)
    )
  );