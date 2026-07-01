-- Legal compliance: consent columns + store_reports table + RLS
-- Change: ecuadorean-legal-docs

-- 1. Add legal_version to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS legal_version text NOT NULL DEFAULT '1';

COMMENT ON COLUMN public.site_settings.legal_version IS 'Current version of legal documents; bumping triggers re-consent banner';

-- 2. Add consent columns to tenant_members
ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS legal_accepted_version text,
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz;

COMMENT ON COLUMN public.tenant_members.legal_accepted_version IS 'Version of legal docs the member accepted';
COMMENT ON COLUMN public.tenant_members.legal_accepted_at IS 'Timestamp when the member accepted the legal docs';

-- 3. Create store_reports table
CREATE TABLE IF NOT EXISTS public.store_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reporter_email text NOT NULL CHECK (char_length(reporter_email) <= 255),
  reason text NOT NULL CHECK (char_length(reason) <= 100),
  details text NOT NULL CHECK (char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  moderator_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index on tenant_id for FK lookups
CREATE INDEX IF NOT EXISTS idx_store_reports_tenant_id ON public.store_reports(tenant_id);
-- Index on status for pending reports query
CREATE INDEX IF NOT EXISTS idx_store_reports_status ON public.store_reports(status);

-- 4. Enable RLS on store_reports
ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert reports (anonymous + authenticated)
CREATE POLICY "Anyone can insert store reports" ON public.store_reports
  FOR INSERT TO public WITH CHECK (true);

-- Only platform admins can select reports
CREATE POLICY "Admins can select store reports" ON public.store_reports
  FOR SELECT TO authenticated USING (public.is_platform_admin());

-- Only platform admins can update reports
CREATE POLICY "Admins can update store reports" ON public.store_reports
  FOR UPDATE TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

-- 5. Auto-update trigger for updated_at
CREATE TRIGGER store_reports_updated_at
  BEFORE UPDATE ON public.store_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
