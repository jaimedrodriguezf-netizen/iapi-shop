-- Transactional order creation: inserts order header + items atomically
-- Replaces manual rollback pattern in application code.

CREATE OR REPLACE FUNCTION create_order_transaction(
  p_tenant_id  UUID,
  p_total_amount NUMERIC,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT,
  p_items JSONB
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
    status
  ) VALUES (
    p_tenant_id,
    p_total_amount,
    p_customer_name,
    p_customer_phone,
    p_notes,
    'pending'
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