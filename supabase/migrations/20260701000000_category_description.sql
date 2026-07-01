-- Migración para añadir description a categories y convertirlas en globales
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;

-- Hacer tenant_id opcional para categorías globales
ALTER TABLE public.categories ALTER COLUMN tenant_id DROP NOT NULL;

-- Para asegurar slugs únicos globales cuando tenant_id es nulo (índice parcial)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_global_slug ON public.categories (slug) WHERE tenant_id IS NULL;

-- Actualizar las políticas de RLS para categorías globales
-- 1. Cualquiera puede leer las categorías globales
CREATE POLICY "categories_select_global" ON public.categories
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL);

-- 2. Solo el admin puede insertar/actualizar/eliminar categorías globales
CREATE POLICY "categories_insert_global" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IS NULL AND public.is_platform_admin());

CREATE POLICY "categories_update_global" ON public.categories
  FOR UPDATE TO authenticated
  USING (tenant_id IS NULL AND public.is_platform_admin())
  WITH CHECK (tenant_id IS NULL AND public.is_platform_admin());

CREATE POLICY "categories_delete_global" ON public.categories
  FOR DELETE TO authenticated
  USING (tenant_id IS NULL AND public.is_platform_admin());
