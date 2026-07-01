-- ============================================================
-- Security: Restrict anon access to tenant_subscriptions
-- Previously the anon policy exposed ALL columns of active
-- subscriptions. This migration:
-- 1. Creates a restricted VIEW exposing only tenant_id + plan_id + plan name
-- 2. Drops the overly-permissive anon policy on the table
-- 3. Grants SELECT on the view to anon role
-- ============================================================

-- 1. Create a restricted view for public subscription access.
-- Only exposes tenant_id and plan details for active subscriptions.
-- Never exposes id, status, current_period_start, or billing details.
CREATE OR REPLACE VIEW public.public_tenant_subscriptions AS
SELECT
  ts.tenant_id,
  ts.plan_id,
  p.name AS plan_name
FROM public.tenant_subscriptions ts
JOIN public.plans p ON p.id = ts.plan_id
WHERE ts.status = 'active';

-- 2. Drop the overly-permissive anon policy on the base table
DROP POLICY IF EXISTS "tenant_subscriptions_select_public_active" ON public.tenant_subscriptions;

-- 3. Grant anon access to the restricted view instead
GRANT SELECT ON public.public_tenant_subscriptions TO anon;