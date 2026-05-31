-- Migration: Order Management & Analytics
-- Create order_status enum, orders, and order_items tables, and enable RLS.

create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_name text,
  customer_phone text,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status public.order_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create order_items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity >= 1),
  created_at timestamptz not null default now()
);

-- Set updated_at trigger for orders
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists idx_orders_tenant_id on public.orders(tenant_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- Enable RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- RLS Policies
-- 1. Anyone can insert orders (public checkout)
create policy "orders_insert_public" on public.orders
  for insert
  with check (true);

-- 2. Tenant members can select orders
create policy "orders_select_member" on public.orders
  for select to authenticated
  using (public.has_tenant_role(tenant_id));

-- 3. Tenant members can update orders (e.g. status)
create policy "orders_update_member" on public.orders
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin','sales']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','admin','sales']::public.tenant_role[]));

-- 4. Anyone can insert order items
create policy "order_items_insert_public" on public.order_items
  for insert
  with check (true);

-- 5. Tenant members can select order items
create policy "order_items_select_member" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and public.has_tenant_role(o.tenant_id)
    )
  );
