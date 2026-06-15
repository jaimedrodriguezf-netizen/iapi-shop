-- Migration: Ecuador Address Locations
-- Created: 2026-06-09 22:09:24

CREATE TABLE IF NOT EXISTS public.countries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    code text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provinces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS public.cantons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id uuid REFERENCES public.provinces(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(province_id, name)
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cantons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to countries" ON public.countries;
CREATE POLICY "Allow public read access to countries" ON public.countries
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access to provinces" ON public.provinces;
CREATE POLICY "Allow public read access to provinces" ON public.provinces
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access to cantons" ON public.cantons;
CREATE POLICY "Allow public read access to cantons" ON public.cantons
    FOR SELECT TO public USING (true);

-- Seed Countries
INSERT INTO public.countries (name, code) VALUES
    ('Ecuador', 'EC'),
    ('Colombia', 'CO'),
    ('Peru', 'PE')
ON CONFLICT (name) DO NOTHING;

-- Seed Provinces for Ecuador
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Azuay' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Bolívar' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Cañar' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Carchi' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Chimborazo' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Cotopaxi' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'El Oro' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Esmeraldas' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Galápagos' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Guayas' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Imbabura' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Loja' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Los Ríos' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Manabí' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Morona-Santiago' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Napo' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Orellana' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Pastaza' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Pichincha' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Santa Elena' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Santo Domingo de los Tsáchilas' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Sucumbíos' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;
INSERT INTO public.provinces (country_id, name)
SELECT id, 'Tungurahua' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;

-- Seed Cantons for Ecuador
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Camilo Ponce Enríquez' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chordeleg' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cuenca' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Pan' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Girón' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Guachapala' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Gualaceo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Nabón' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Oña' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Paute' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pucará' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Fernando' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Isabel' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sevilla de Oro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sigsig' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Azuay'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Caluma' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chillanes' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chimbo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Echeandía' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Guaranda' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Las Naves' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Miguel' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Bolívar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Azogues' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'La Troncal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Biblián' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cañar' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Déleg' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Tambo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Suscal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cañar'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Bolívar' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Espejo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Mira' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Montúfar' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Pedro de Huaca' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Tulcán' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Alausí' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Carchi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chambo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chunchi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Colta' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cumandá' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Guamote' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Guano' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pallatanga' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Penipe' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Riobamba' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Chimborazo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'La Maná' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Latacunga' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pangua' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pujilí' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Salcedo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Saquisilí' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sigchos' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Cotopaxi'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Arenillas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Atahualpa' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Balsas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chilla' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Guabo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Huaquillas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Las Lajas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Machala' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Marcabelí' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pasaje' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Piñas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Portovelo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Rosa' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Zaruma' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'El Oro'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Atacames' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Eloy Alfaro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Esmeraldas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Muisne' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quinindé' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Río Verde' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Lorenzo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Esmeraldas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Isabela' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Galápagos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Cristóbal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Galápagos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Cruz' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Galápagos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Alfredo Baquerizo Moreno (Jujan)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Balao' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Balzar (San Jacinto de Balzar)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Colimes' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Coronel Marcelino Maridueña' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Daule' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Durán' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Empalme' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Triunfo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'General Antonio Elizalde (Bucay)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Guayaquil' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Isidro Ayora' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Lomas de Sargentillo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Milagro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Naranjal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Naranjito' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Nobol' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Palestina' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pedro Carbo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Playas (General Villamil Playas)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Salitre (was Urbina Jado)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Samborondón' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Lucía' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Simón Bolívar' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'La Troncal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Yaguachi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Guayas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Antonio Ante' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cotacachi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Ibarra' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Otavalo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pimampiro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Miguel de Urcuquí' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Imbabura'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Calvas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Catamayo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Celica' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chaguarpamba' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Espíndola' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Gonzanamá' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Loja' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Macará' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Olmedo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Paltas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pindal' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Puyango' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quilanga' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Saraguro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sozoranga' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Zapotillo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Loja'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Baba' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Babahoyo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Buena Fé' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Mocache' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Montalvo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Palenque' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pueblo Viejo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quevedo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quinsaloma' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Urdaneta' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Valencia' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Ventanas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Vinces' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Los Ríos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Bolívar' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chone' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Carmen' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Flavio Alfaro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Jama' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Jaramijó' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Jipijapa' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Junín' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Manta' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Montecristi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Olmedo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Paján' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pedernales' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pichincha' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Portoviejo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Puerto López' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Rocafuerte' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Vicente' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Ana' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sucre' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Tosagua' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Veinticuatro de Mayo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Manabí'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Gualaquiza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Huamboya' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Limón Indanza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Logroño' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Morona' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pablo Sexto' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Palora' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Juan Bosco' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santiago de Méndez (Santiago)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sucúa' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Taisha' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Tiwintza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Morona-Santiago'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Archidona' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Napo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Carlos Julio Arosemena Tola' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Napo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Chaco' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Napo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quijos' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Napo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Tena' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Napo'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Aguarico' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Orellana'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Francisco de Orellana' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Orellana'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Joya de los Sachas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Orellana'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Loreto' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Orellana'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Arajuno' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pastaza'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Mera' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pastaza'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pastaza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pastaza'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Clara' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pastaza'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cayambe' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Mejía' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pedro Moncayo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pedro Vicente Maldonado' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Puerto Quito' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quito' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Rumiñahui' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'San Miguel de Los Bancos' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Pichincha'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'La Libertad' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Santa Elena'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Salinas' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Santa Elena'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santa Elena' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Santa Elena'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Santo Domingo de los Colorados (Santo Domingo)' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Santo Domingo de los Tsáchilas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'La Concordia' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Santo Domingo de los Tsáchilas'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cascales' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cuyabeno' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Gonzalo Pizarro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Lago Agrio' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Putumayo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Shushufindi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Sucumbíos' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Sucumbíos'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Tisaleo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Ambato' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Baños' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Cevallos' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Mocha' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Patate' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Pelileo' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Píllaro' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Quero' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Centinela del Cóndor' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Chinchipe' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'El Pangui' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Nangaritza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Palanda' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Paquisha' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Yacuambi' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Yantzaza' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
INSERT INTO public.cantons (province_id, name)
SELECT id, 'Zamora' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = 'Tungurahua'
ON CONFLICT (province_id, name) DO NOTHING;
