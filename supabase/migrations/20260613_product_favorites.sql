-- Product favorites table for authenticated users to save products they like
CREATE TABLE IF NOT EXISTS public.product_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_product ON public.product_favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tenant_created ON public.product_favorites(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.product_favorites(user_id);

ALTER TABLE public.product_favorites ENABLE ROW LEVEL SECURITY;

-- User can see their own favorites
CREATE POLICY "favorites_select_own" ON public.product_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- User can insert their own favorites
CREATE POLICY "favorites_insert_own" ON public.product_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User can delete their own favorites
CREATE POLICY "favorites_delete_own" ON public.product_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Tenant members can see favorites for their tenant's products (for stats)
CREATE POLICY "favorites_select_tenant_stats" ON public.product_favorites
  FOR SELECT TO authenticated
  USING (public.has_tenant_role(tenant_id, array['owner','admin','sales','viewer']::public.tenant_role[]));