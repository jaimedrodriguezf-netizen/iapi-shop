-- Add compare_at_price to products for real discount support
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric(10,2) DEFAULT NULL
  CHECK (compare_at_price IS NULL OR compare_at_price >= 0);

COMMENT ON COLUMN public.products.compare_at_price IS 'Original/higher price for displaying discounts. If set and > price, storefront shows discount badge.';