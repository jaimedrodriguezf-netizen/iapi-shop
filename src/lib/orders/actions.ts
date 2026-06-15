"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertTenantMember } from "@/lib/auth/guards";
import { orderRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications/actions";

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
  customer_user_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Zod Schemas ──────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID inválido");

const orderItemSchema = z.object({
  product_id: z.string().uuid("ID de producto inválido"),
  product_name: z.string().min(1, "Nombre de producto requerido").max(200),
  unit_price: z.number().min(0, "El precio unitario no puede ser negativo"),
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
});

const createOrderSchema = z.object({
  tenant_id: z.string().uuid("ID de tenant inválido"),
  total_amount: z.number().min(0, "El monto total no puede ser negativo"),
  items: z.array(orderItemSchema).min(1, "La orden debe tener al menos un producto"),
  customer_name: z.string().max(200, "Nombre muy largo").optional(),
  customer_phone: z.string().max(50, "Teléfono muy largo").optional(),
  notes: z.string().max(1000, "Notas muy largas").optional(),
  customer_user_id: z.string().uuid().nullable().optional(),
});

const orderStatusSchema = z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ── Server Actions ───────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<ActionResult<string>> {
  try {
    // Validate input
    const parsed = createOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    // Rate limiting
    const clientIp = await getClientIdentifier();
    const { success: rateLimitOk } = await orderRateLimit.limit(clientIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." };
    }

    const supabase = await createClient();

    // Resolve customer_user_id: explicit param > authenticated user > null
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const customerUserId = parsed.data.customer_user_id || authUser?.id || null;

    // Verify tenant exists and is active
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, status")
      .eq("id", parsed.data.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Tienda no encontrada" };
    }

    if (tenant.status !== "active") {
      return { success: false, error: "La tienda no está disponible" };
    }

    // ── Price validation: fetch actual product prices and verify ──
    const productIds = parsed.data.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price")
      .in("id", productIds)
      .eq("tenant_id", parsed.data.tenant_id);

    if (productsError) {
      return { success: false, error: "Error al verificar precios de productos." };
    }

    // Verify all product_ids exist and belong to this tenant
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of parsed.data.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return { success: false, error: `Producto no encontrado: ${item.product_name}` };
      }
      if (Math.abs(item.unit_price - product.price) > 0.01) {
        return { success: false, error: `El precio de "${product.name}" no coincide con el precio actual.` };
      }
    }

    // Recalculate total from verified prices (never trust client input)
    const itemsWithVerifiedPrices = parsed.data.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      return {
        ...item,
        unit_price: product.price,
      };
    });

    const verifiedTotal = itemsWithVerifiedPrices.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    // Use transactional RPC to create order + items atomically
    const itemsJson = itemsWithVerifiedPrices.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
    }));

    const { data: orderId, error: rpcError } = await supabase.rpc(
      "create_order_transaction",
      {
        p_tenant_id: parsed.data.tenant_id,
        p_total_amount: verifiedTotal,
        p_customer_name: parsed.data.customer_name ?? null,
        p_customer_phone: parsed.data.customer_phone ?? null,
        p_notes: parsed.data.notes ?? null,
        p_items: itemsJson,
        p_customer_user_id: customerUserId,
      }
    );

    if (rpcError) {
      console.error("createOrder rpc:", rpcError);
      return { success: false, error: "Error al procesar los pedidos" };
    }

    // Notify tenant members about new order
    const { data: members } = await supabase
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", parsed.data.tenant_id)

    if (members) {
      for (const member of members) {
        await createNotification(
          member.user_id,
          "new_order",
          "¡Nuevo pedido recibido!",
          `Recibiste un nuevo pedido por $${verifiedTotal.toFixed(2)}`,
          `/dashboard/orders`
        )
      }
    }

    return { success: true, data: orderId as string };
  } catch (error) {
    console.error("Create Order Error:", error);
    return { success: false, error: "Error inesperado al procesar el pedido" };
  }
}

export async function getTenantOrders(tenantId: string): Promise<ActionResult<Order[]>> {
  try {
    // Validate tenantId format
    const parsed = uuidSchema.safeParse(tenantId);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const supabase = await createClient();

    // Auth guard
    const membership = await assertTenantMember(supabase, parsed.data);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("tenant_id", parsed.data)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getTenantOrders:", error);
      return { success: false, error: "Error al procesar los pedidos" };
    }
    return { success: true, data: data as Order[] };
  } catch (error) {
    return { success: false, error: "Error al obtener las órdenes" };
  }
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<ActionResult<null>> {
  try {
    // Validate inputs
    const tenantParsed = uuidSchema.safeParse(tenantId);
    if (!tenantParsed.success) {
      return { success: false, error: tenantParsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const orderParsed = uuidSchema.safeParse(orderId);
    if (!orderParsed.success) {
      return { success: false, error: orderParsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const statusParsed = orderStatusSchema.safeParse(status);
    if (!statusParsed.success) {
      return { success: false, error: "Estado inválido" };
    }

    const supabase = await createClient();

    // Auth guard
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    // Tenant membership guard
    const membership = await assertTenantMember(supabase, tenantParsed.data);
    if (!membership.ok) {
      return { success: false, error: membership.error };
    }

    // Multi-tenancy Isolation: Verificar propiedad explícitamente en la aplicación
    const { error } = await supabase
      .from("orders")
      .update({ status: statusParsed.data })
      .eq("id", orderParsed.data)
      .eq("tenant_id", tenantParsed.data);

    if (error) {
      console.error("updateOrderStatus:", error);
      return { success: false, error: "Error al procesar los pedidos" };
    }

    // Notify the customer if they are a registered user
    const { data: orderData } = await supabase
      .from("orders")
      .select("customer_user_id, total_amount")
      .eq("id", orderParsed.data)
      .single();

    if (orderData?.customer_user_id) {
      const statusMessages: Record<string, string> = {
        confirmed: "Tu pedido fue confirmado",
        shipped: "Tu pedido está en camino",
        delivered: "Tu pedido fue entregado",
        cancelled: "Tu pedido fue cancelado",
      };

      const title = statusMessages[statusParsed.data] || "Tu pedido fue actualizado";
      const body = `Pedido por $${Number(orderData.total_amount).toFixed(2)} — ${title.toLowerCase()}`;

      await createNotification(
        orderData.customer_user_id,
        `order_${statusParsed.data}`,
        title,
        body,
        `/dashboard/orders`
      );
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar estado" };
  }
}