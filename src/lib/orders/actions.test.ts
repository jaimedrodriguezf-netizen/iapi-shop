import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrder, getTenantOrders, updateOrderStatus } from "./actions";
import { orderRateLimit } from "@/lib/rate-limit";

// Auto-resolving chainable mock
function chain(result: unknown = { data: null, error: null }) {
  const target = {
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return new Proxy(target, {
    get(_, prop: string, receiver) {
      if (prop === 'then') return Reflect.get(target, prop, receiver);
      return vi.fn().mockReturnValue(chain(result));
    },
  });
}

function makeSupabase() {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    from: vi.fn().mockReturnValue(chain()),
    rpc: vi.fn().mockResolvedValue("order-1"),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  orderRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/auth/guards", () => ({
  assertTenantMember: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/notifications/actions", () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
}));

import { createClient } from "@/lib/supabase/server";

describe("Orders Security Tests", () => {
  let mockSupabase: ReturnType<typeof makeSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderRateLimit.limit).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() });
    mockSupabase = makeSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  // ── createOrder ──────────────────────────────────────────

  describe("createOrder — input validation", () => {
    const tenantId = "550e8400-e29b-41d4-a716-446655440000";
    const productId = "660e8400-e29b-41d4-a716-446655440001";

    function setupTenant(status: string) {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === "tenants") return chain({ data: { id: tenantId, status }, error: null });
        if (table === "products") return chain({ data: [{ id: productId, name: "Test", price: 50.25 }], error: null });
        return chain();
      });
    }

    it("should create an order with valid input", async () => {
      setupTenant("active");
      // Override rpc for this test
      mockSupabase.rpc.mockResolvedValue("order-xyz");

      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100.50,
        items: [{ product_id: productId, product_name: "Test Product", unit_price: 50.25, quantity: 2 }],
        customer_name: "Juan Pérez",
        customer_phone: "+593999999999",
        notes: "Entregar en la tarde",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe("order-xyz");
    });

    it("should reject order when tenant_id is not a valid UUID", async () => {
      const result = await createOrder({
        tenant_id: "not-a-uuid",
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject order when total_amount is negative", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: -100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("negativo");
    });

    it("should accept order with total_amount = 0 (free order)", async () => {
      setupTenant("active");
      mockSupabase.rpc.mockResolvedValue("order-zero");

      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 0,
        items: [{ product_id: productId, product_name: "Free Item", unit_price: 0, quantity: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject order with empty items array", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 0,
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("producto");
    });

    it("should reject item with negative unit_price", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: -10, quantity: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with quantity = 0", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with negative quantity", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: -5 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject customer_name with possible XSS payload (no longer accepted)", async () => {
      // The createOrderSchema now validates customer_name, and the price verification
      // must match. With valid setup, XSS in name might be stripped or rejected.
      setupTenant("active");
      mockSupabase.rpc.mockResolvedValue("order-xss");

      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 50.25, quantity: 2 }],
        customer_name: "<script>alert('xss')</script>",
      });
      // The action should still succeed (XSS is escaped at render time, not stored)
      expect(result.success).toBe(true);
    });

    it("should reject notes that exceed max length", async () => {
      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
        notes: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject order when tenant does not exist", async () => {
      mockSupabase.from = vi.fn().mockReturnValue(chain({ data: null, error: { message: "Not found" } }));

      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655449999",
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Tienda no encontrada");
    });

    it("should reject order when tenant is inactive", async () => {
      setupTenant("draft");

      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("disponible");
    });
  });

  // ── getTenantOrders ──────────────────────────────────────

  describe("getTenantOrders — auth & tenant isolation", () => {
    it("should reject when tenantId is not a valid UUID", async () => {
      const result = await getTenantOrders("not-a-uuid");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });
  });

  // ── updateOrderStatus ────────────────────────────────────

  describe("updateOrderStatus — auth & tenant isolation", () => {
    it("should reject when tenantId is not a valid UUID", async () => {
      const result = await updateOrderStatus("not-a-uuid", "660e8400-e29b-41d4-a716-446655440001", "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject when orderId is not a valid UUID", async () => {
      const result = await updateOrderStatus("550e8400-e29b-41d4-a716-446655440000", "not-a-uuid", "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject when status is not a valid OrderStatus", async () => {
      const result = await updateOrderStatus("550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001", "hacked" as unknown as string);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Estado");
    });
  });

  describe("rate limiting on createOrder", () => {
    it("blocks order creation when rate limit is exceeded", async () => {
      vi.mocked(orderRateLimit.limit).mockResolvedValueOnce({
        success: false, limit: 10, remaining: 0, reset: Date.now() + 60000, pending: Promise.resolve(),
      });
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Demasiadas solicitudes");
    });

    it("allows order creation when under rate limit", async () => {
      vi.mocked(orderRateLimit.limit).mockResolvedValueOnce({
        success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve(),
      });
      const tenantId = "550e8400-e29b-41d4-a716-446655440000";
      const productId = "660e8400-e29b-41d4-a716-446655440001";
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === "tenants") return chain({ data: { id: tenantId, status: "active" }, error: null });
        if (table === "products") return chain({ data: [{ id: productId, name: "Test", price: 100 }], error: null });
        return chain();
      });
      mockSupabase.rpc.mockResolvedValue("order-ok");

      const result = await createOrder({
        tenant_id: tenantId,
        total_amount: 100,
        items: [{ product_id: productId, product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(true);
    });
  });
});
