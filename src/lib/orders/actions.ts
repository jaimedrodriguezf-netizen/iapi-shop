"use server";

import { createClient } from "@/lib/supabase/server";

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateOrderInput {
  tenant_id: string;
  total_amount: number;
  items: {
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();

    // 1. Crear la Orden (Cabecera)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id: input.tenant_id,
        total_amount: input.total_amount,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        notes: input.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) return { success: false, error: orderError.message };

    // 2. Crear los Ítems (Líneas)
    const itemsToInsert = input.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback manual (Technical Integrity)
      await supabase.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Error al guardar los productos de la orden. Transacción cancelada." };
    }

    return { success: true, data: order.id };
  } catch (error) {
    console.error("Create Order Error:", error);
    return { success: false, error: "Error inesperado al procesar el pedido" };
  }
}

export async function getTenantOrders(tenantId: string): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Order[] };
  } catch (error) {
    return { success: false, error: "Error al obtener las órdenes" };
  }
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    // Multi-tenancy Isolation: Verificar propiedad explícitamente en la aplicación
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("tenant_id", tenantId); // Filtro obligatorio por mandato GGA

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar estado" };
  }
}
