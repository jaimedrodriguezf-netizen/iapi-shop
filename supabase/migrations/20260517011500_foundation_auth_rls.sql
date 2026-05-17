-- IAPI Shop foundation auth, roles, subscriptions, and RLS.

create extension if not exists pgcrypto;

create type public.tenant_role as enum ('owner', 'admin', 'sales', 'inventory', 'viewer');
create type public.member_status as enum ('active', 'invited', 'suspended');
create type public.platform_role as enum ('admin', 'support', 'moderator', 'billing_admin');
create type public.tenant_status as enum ('draft', 'active', 'suspended', 'archived');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
create type public.payment_method as enum ('manual', 'paypal', 'bank_transfer', 'cash');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.platform_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.tenant_status not null default 'draft',
  whatsapp_phone text,
  city text,
  province text,
  logo_url text,
  qr_code_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null,
  status public.member_status not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  price_monthly numeric(10,2) not null default 0 check (price_monthly >= 0),
  product_limit integer not null default 10 check (product_limit >= 0),
  user_limit integer not null default 1 check (user_limit >= 1),
  ai_text_credits integer not null default 0 check (ai_text_credits >= 0),
  ai_image_credits integer not null default 0 check (ai_image_credits >= 0),
  qr_analytics_enabled boolean not null default false,
  custom_domain_enabled boolean not null default false,
  advanced_reports_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_subscription_id uuid not null references public.tenant_subscriptions(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  method public.payment_method not null default 'manual',
  status public.payment_status not null default 'pending',
  reference text,
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_admins_user_id on public.platform_admins(user_id);
create index if not exists idx_tenants_slug on public.tenants(slug);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
create index if not exists idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index if not exists idx_tenant_subscriptions_tenant_id on public.tenant_subscriptions(tenant_id);
create index if not exists idx_subscription_payments_subscription_id on public.subscription_payments(tenant_subscription_id);
create index if not exists idx_audit_logs_tenant_id_created_at on public.audit_logs(tenant_id, created_at desc);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_platform_admins_updated_at before update on public.platform_admins for each row execute function public.set_updated_at();
create trigger set_tenants_updated_at before update on public.tenants for each row execute function public.set_updated_at();
create trigger set_tenant_members_updated_at before update on public.tenant_members for each row execute function public.set_updated_at();
create trigger set_plans_updated_at before update on public.plans for each row execute function public.set_updated_at();
create trigger set_tenant_subscriptions_updated_at before update on public.tenant_subscriptions for each row execute function public.set_updated_at();
create trigger set_subscription_payments_updated_at before update on public.subscription_payments for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_platform_admin(required_role public.platform_role default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
      and (required_role is null or pa.role = required_role or pa.role = 'admin')
  );
$$;

create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles public.tenant_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and (allowed_roles is null or tm.role = any(allowed_roles))
  ) or public.is_platform_admin();
$$;

create or replace function public.current_user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tm.tenant_id
  from public.tenant_members tm
  where tm.user_id = auth.uid()
    and tm.status = 'active';
$$;

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.plans enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own_or_platform_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "platform_admins_select_platform_admin" on public.platform_admins
  for select to authenticated
  using (public.is_platform_admin());

create policy "platform_admins_manage_admin" on public.platform_admins
  for all to authenticated
  using (public.is_platform_admin('admin'))
  with check (public.is_platform_admin('admin'));

create policy "tenants_select_member_or_platform_admin" on public.tenants
  for select to authenticated
  using (public.has_tenant_role(id));

create policy "tenants_insert_authenticated" on public.tenants
  for insert to authenticated
  with check (created_by = auth.uid() or public.is_platform_admin());

create policy "tenants_update_owner_admin_or_platform_admin" on public.tenants
  for update to authenticated
  using (public.has_tenant_role(id, array['owner','admin']::public.tenant_role[]))
  with check (public.has_tenant_role(id, array['owner','admin']::public.tenant_role[]));

create policy "tenant_members_select_same_tenant_or_platform_admin" on public.tenant_members
  for select to authenticated
  using (public.has_tenant_role(tenant_id));

create policy "tenant_members_manage_owner_admin_or_platform_admin" on public.tenant_members
  for all to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

create policy "plans_select_authenticated" on public.plans
  for select to authenticated
  using (is_active or public.is_platform_admin());

create policy "plans_manage_platform_admin" on public.plans
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "tenant_subscriptions_select_tenant_owner_admin_or_platform_admin" on public.tenant_subscriptions
  for select to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

create policy "tenant_subscriptions_manage_owner_or_platform_admin" on public.tenant_subscriptions
  for all to authenticated
  using (public.has_tenant_role(tenant_id, array['owner']::public.tenant_role[]))
  with check (public.has_tenant_role(tenant_id, array['owner']::public.tenant_role[]));

create policy "subscription_payments_select_subscription_owner_admin_or_platform_admin" on public.subscription_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.tenant_subscriptions ts
      where ts.id = tenant_subscription_id
        and public.has_tenant_role(ts.tenant_id, array['owner','admin']::public.tenant_role[])
    )
  );

create policy "subscription_payments_manage_owner_or_platform_admin" on public.subscription_payments
  for all to authenticated
  using (
    exists (
      select 1 from public.tenant_subscriptions ts
      where ts.id = tenant_subscription_id
        and public.has_tenant_role(ts.tenant_id, array['owner']::public.tenant_role[])
    )
  )
  with check (
    exists (
      select 1 from public.tenant_subscriptions ts
      where ts.id = tenant_subscription_id
        and public.has_tenant_role(ts.tenant_id, array['owner']::public.tenant_role[])
    )
  );

create policy "audit_logs_select_tenant_admin_or_platform_admin" on public.audit_logs
  for select to authenticated
  using (tenant_id is not null and public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[]));

create policy "audit_logs_insert_authenticated" on public.audit_logs
  for insert to authenticated
  with check (actor_user_id = auth.uid() or public.is_platform_admin());

insert into public.plans (code, name, price_monthly, product_limit, user_limit, ai_text_credits, ai_image_credits, qr_analytics_enabled)
values
  ('free', 'Free', 0, 10, 1, 20, 5, false),
  ('starter', 'Starter', 9.99, 50, 2, 100, 20, true),
  ('pro', 'Pro', 29.99, 300, 5, 500, 100, true),
  ('business', 'Business', 79.99, 2000, 10, 2000, 500, true)
on conflict (code) do update set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  product_limit = excluded.product_limit,
  user_limit = excluded.user_limit,
  ai_text_credits = excluded.ai_text_credits,
  ai_image_credits = excluded.ai_image_credits,
  qr_analytics_enabled = excluded.qr_analytics_enabled;

insert into public.platform_admins (user_id, role)
select id, 'admin'::public.platform_role
from auth.users
where lower(email) = 'admin@iapi.shop'
on conflict (user_id) do update set role = excluded.role;
