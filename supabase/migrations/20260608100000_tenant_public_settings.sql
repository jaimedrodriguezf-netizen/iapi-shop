-- Migration to add public_settings to tenants table
-- Adds: public_settings (JSONB) with default values for catalog privacy

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS public_settings jsonb DEFAULT '{"show_phone": true, "show_address": true, "show_social_links": true}'::jsonb;

COMMENT ON COLUMN public.tenants.public_settings IS 'Catalog privacy settings: { show_phone, show_address, show_social_links }';
