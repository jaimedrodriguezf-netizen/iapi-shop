CREATE TABLE IF NOT EXISTS public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text,
  cta_href text DEFAULT '#',
  image_url text,
  bg_color text DEFAULT '#f97316',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only authenticated (admin-managed via server actions using service_role)
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners
CREATE POLICY "Anyone can read active banners" ON public.promo_banners
  FOR SELECT TO public
  USING (is_active = true);

-- Platform admins can manage banners (via service_role in server actions)
CREATE POLICY "Admins can manage banners" ON public.promo_banners
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Seed some default banners
INSERT INTO public.promo_banners (title, subtitle, cta_text, cta_href, bg_color, display_order) VALUES
  ('Catálogo Digital Gratis', 'Creá tu tienda y empezá a vender por WhatsApp', 'Crear Tienda', '/register', '#f97316', 0),
  ('Pedí por WhatsApp', 'Explorá productos locales y hacé tu pedido directo', 'Ver Productos', '#products', '#14b8a6', 1),
  ('Sin Comisiones', 'Vendé gratis, solo pagás cuando querés crecer', 'Más Info', '/register', '#f59e0b', 2);