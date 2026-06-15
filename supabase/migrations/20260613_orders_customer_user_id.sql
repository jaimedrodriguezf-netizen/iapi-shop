ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.orders.customer_user_id IS 'User who placed the order (for notifications). Null for anonymous orders.';
CREATE INDEX IF NOT EXISTS idx_orders_customer_user_id ON public.orders(customer_user_id);

-- Update RPC to accept and store customer_user_id
CREATE OR REPLACE FUNCTION create_order_transaction(
  p_tenant_id  UUID,
  p_total_amount NUMERIC,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_customer_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- Insert order header
  INSERT INTO orders (
    tenant_id,
    total_amount,
    customer_name,
    customer_phone,
    notes,
    status,
    customer_user_id
  ) VALUES (
    p_tenant_id,
    p_total_amount,
    p_customer_name,
    p_customer_phone,
    p_notes,
    'pending',
    p_customer_user_id
  )
  RETURNING id INTO v_order_id;

  -- Insert all order items within the same transaction
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
    ) VALUES (
      v_order_id,
      (v_item ->> 'product_id')::UUID,
      v_item ->> 'product_name',
      (v_item ->> 'unit_price')::NUMERIC,
      (v_item ->> 'quantity')::INTEGER
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;