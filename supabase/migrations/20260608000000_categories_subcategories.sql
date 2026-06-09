-- Migration: Categories Hierarchy Support
-- Add parent_id to categories

ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Index for fast parent queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Add comment
COMMENT ON COLUMN public.categories.parent_id IS 'Parent category for subcategories (null for top-level categories)';
