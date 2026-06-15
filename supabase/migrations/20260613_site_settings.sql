CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- single row
  logo_url text,
  site_name text DEFAULT 'IAPI Shop',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default
INSERT INTO public.site_settings (id, logo_url, site_name) 
VALUES (1, NULL, 'IAPI Shop')
ON CONFLICT (id) DO NOTHING;

-- RLS: public can read
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_platform_admin());