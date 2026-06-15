-- Migration: Hardening orders RLS policies
-- Replace permissive check(true) policies with tenant validation

drop policy if exists "orders_insert_public" on public.orders;
drop policy if exists "order_items_insert_public" on public.order_items;

create policy "orders_insert_public" on public.orders
  for insert
  with check (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_id
        and t.status = 'active'
    )
  );

create policy "order_items_insert_public" on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
    )
  );
