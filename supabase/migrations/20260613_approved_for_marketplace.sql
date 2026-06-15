ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS approved_for_marketplace boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.approved_for_marketplace IS 'Admin must approve before product appears on marketplace landing page';

CREATE INDEX IF NOT EXISTS idx_products_approved_marketplace ON public.products(approved_for_marketplace) WHERE approved_for_marketplace = true;