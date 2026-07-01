-- Sections table (marketplace or per-tenant collections)
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE, -- null = marketplace global
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  slug text NOT NULL,
  description text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- Products assigned to sections
CREATE TABLE IF NOT EXISTS public.section_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sections_tenant_active ON public.sections(tenant_id, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sections_marketplace_active ON public.sections(display_order) WHERE tenant_id IS NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_section_products_section ON public.section_products(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_section_products_product ON public.section_products(product_id);

-- RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_products ENABLE ROW LEVEL SECURITY;

-- Sections RLS policies
CREATE POLICY "Anyone can read active sections" ON public.sections
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Tenant members can manage their sections" ON public.sections
  FOR ALL TO authenticated
  USING (
    tenant_id IS NOT NULL 
    AND public.has_tenant_role(tenant_id, array['owner','admin']::public.tenant_role[])
  );

CREATE POLICY "Platform admins can manage marketplace sections" ON public.sections
  FOR ALL TO authenticated
  USING (
    tenant_id IS NULL 
    AND public.is_platform_admin()
  );

-- Section products RLS
CREATE POLICY "Anyone can read section products" ON public.section_products
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant members can manage section products" ON public.section_products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      WHERE s.id = section_id
      AND s.tenant_id IS NOT NULL
      AND public.has_tenant_role(s.tenant_id, array['owner','admin']::public.tenant_role[])
    )
  );

CREATE POLICY "Platform admins can manage marketplace section products" ON public.section_products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      WHERE s.id = section_id
      AND s.tenant_id IS NULL
      AND public.is_platform_admin()
    )
  );