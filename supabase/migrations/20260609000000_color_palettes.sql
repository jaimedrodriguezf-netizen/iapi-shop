-- Create color_palettes table
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  brand_color text NOT NULL,
  secondary_color text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;

-- Create policy to permit public reading
CREATE POLICY "Permitir lectura pública de paletas" ON public.color_palettes
  FOR SELECT TO public USING (true);

-- Insert seed preset color palettes
INSERT INTO public.color_palettes (name, brand_color, secondary_color) VALUES
  ('Pastel', '#fbcfe8', '#bae6fd'),
  ('Warm', '#f97316', '#facc15'),
  ('Neon', '#06b6d4', '#f43f5e'),
  ('Tech', '#0f172a', '#3b82f6'),
  ('Nordic', '#1e293b', '#64748b')
ON CONFLICT (name) DO UPDATE SET
  brand_color = EXCLUDED.brand_color,
  secondary_color = EXCLUDED.secondary_color;
