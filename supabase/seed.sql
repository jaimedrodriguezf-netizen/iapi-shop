-- Seed data for product catalog: sample categories per seed tenant.
-- Relies on the foundation seed having created seed tenants.

-- Get existing seed tenants and insert categories for each.
-- We use tenant IDs from the foundation migration's test data.

-- Categories for the first seed tenant (created by foundation seed)
INSERT INTO public.categories (tenant_id, name, slug)
SELECT t.id, cat.name, cat.slug
FROM public.tenants t
CROSS JOIN (
  VALUES
    ('Bebidas', 'bebidas'),
    ('Comidas', 'comidas'),
    ('Postres', 'postres'),
    ('Snacks', 'snacks'),
    ('Combos', 'combos')
) AS cat(name, slug)
WHERE t.status = 'active'
ON CONFLICT (tenant_id, slug) DO NOTHING;