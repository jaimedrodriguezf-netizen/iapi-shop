const fs = require('fs');
const path = require('path');

const mdPath = '/home/jaimepop/.gemini/antigravity-cli/brain/e2c32ee5-b511-43de-8664-31dcbb9e8c9e/.system_generated/steps/280/content.md';
const content = fs.readFileSync(mdPath, 'utf-8');

// The JSON starts after "---"
const jsonStartIndex = content.indexOf('---');
if (jsonStartIndex === -1) {
  console.error("Could not find separator '---'");
  process.exit(1);
}

const jsonText = content.substring(jsonStartIndex + 3).trim();
const rawData = JSON.parse(jsonText);

// Start building SQL
let sql = `-- Migration: Ecuador Address Locations
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

CREATE POLICY "Allow public read access to countries" ON public.countries
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to provinces" ON public.provinces
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to cantons" ON public.cantons
    FOR SELECT TO public USING (true);

-- Seed Countries
INSERT INTO public.countries (name, code) VALUES
    ('Ecuador', 'EC'),
    ('Colombia', 'CO'),
    ('Peru', 'PE')
ON CONFLICT (name) DO NOTHING;
`;

// Map of inserted provinces to avoid duplicates, though JSON has some duplicate entries
const seenProvinces = new Set();
const provinceInsertions = [];
const cantonInsertions = [];

for (const item of rawData) {
  let provinceName = item.Province || item.province;
  if (!provinceName) continue;
  provinceName = provinceName.trim();
  if (provinceName === 'No Province' || provinceName === '') continue; // Skip No Province

  // Azuay, Bolívar, etc.
  if (!seenProvinces.has(provinceName)) {
    seenProvinces.add(provinceName);
    provinceInsertions.push(provinceName);
  }

  // cantons or cantos
  const cantonsList = item.cantons || item.cantos || [];
  for (const c of cantonsList) {
    const cantonName = (c.Canton || c.Canton || '').trim();
    if (!cantonName) continue;
    cantonInsertions.push({ province: provinceName, canton: cantonName });
  }
}

// Generate the province inserts
sql += `\n-- Seed Provinces for Ecuador\n`;
for (const prov of provinceInsertions) {
  const safeProv = prov.replace(/'/g, "''");
  sql += `INSERT INTO public.provinces (country_id, name)
SELECT id, '${safeProv}' FROM public.countries WHERE code = 'EC'
ON CONFLICT (country_id, name) DO NOTHING;\n`;
}

// Generate the canton inserts
sql += `\n-- Seed Cantons for Ecuador\n`;
for (const cant of cantonInsertions) {
  const safeProv = cant.province.replace(/'/g, "''");
  const safeCant = cant.canton.replace(/'/g, "''");
  sql += `INSERT INTO public.cantons (province_id, name)
SELECT id, '${safeCant}' FROM public.provinces WHERE country_id = (SELECT id FROM public.countries WHERE code = 'EC') AND name = '${safeProv}'
ON CONFLICT (province_id, name) DO NOTHING;\n`;
}

fs.writeFileSync(path.resolve(__dirname, '../supabase/migrations/20260609220924_address_locations_ecuador.sql'), sql);
console.log("SQL Migration generated successfully.");
