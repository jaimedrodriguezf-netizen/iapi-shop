-- Migration: Add missing database indexes for performance

-- Index for order_items.product_id (FK without index)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Composite index for orders (tenant_id, created_at) for common query pattern
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON public.orders(tenant_id, created_at DESC);

-- Composite index for product_images (product_id, display_order)
CREATE INDEX IF NOT EXISTS idx_product_images_product_display ON public.product_images(product_id, display_order);

-- Index on orders.status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);