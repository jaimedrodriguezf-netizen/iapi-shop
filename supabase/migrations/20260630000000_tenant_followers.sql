create table if not exists public.tenant_followers (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

-- Index for querying followers of a tenant
create index if not exists idx_tenant_followers_tenant on public.tenant_followers(tenant_id);

alter table public.tenant_followers enable row level security;

create policy "Users can view their own followers"
  on public.tenant_followers for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can follow tenants"
  on public.tenant_followers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unfollow tenants"
  on public.tenant_followers for delete
  to authenticated
  using (auth.uid() = user_id);
