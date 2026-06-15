-- Migration: Add missing unique constraints for data integrity

-- Prevent duplicate payment references (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_payments_reference ON public.subscription_payments(reference) WHERE reference IS NOT NULL;

-- Prevent duplicate display_order per product
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_images_order ON public.product_images(product_id, display_order);