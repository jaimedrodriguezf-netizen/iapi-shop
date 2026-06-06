-- Branding customization fields for tenants
-- Adds: brand_color, secondary_color, address (JSONB), social_links (JSONB)
-- All nullable — zero impact on existing tenants.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS brand_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT NULL;

COMMENT ON COLUMN public.tenants.brand_color IS 'Primary brand hex color, e.g. #7c3aed';
COMMENT ON COLUMN public.tenants.secondary_color IS 'Secondary brand hex color';
COMMENT ON COLUMN public.tenants.address IS 'Structured address: { street, city, state, zip, country }';
COMMENT ON COLUMN public.tenants.social_links IS 'Social media links: { instagram, facebook, tiktok }';