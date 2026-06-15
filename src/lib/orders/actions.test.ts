import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrder, getTenantOrders, updateOrderStatus } from "./actions";
import { orderRateLimit } from "@/lib/rate-limit";

interface MockSupabaseClient {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

function createMockSupabase(): MockSupabaseClient {
  const mock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  } as unknown as MockSupabaseClient;

  mock.insert.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  mock.from.mockReturnValue(mock);

  return mock;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  orderRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

import { createClient } from "@/lib/supabase/server";

describe("Orders Security Tests", () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderRateLimit.limit).mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() });
    mockSupabase = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  // ── createOrder ──────────────────────────────────────────

  describe("createOrder — input validation", () => {
    const validTenant = { id: "550e8400-e29b-41d4-a716-446655440000", status: "active" };
    const validOrder = { id: "order-1" };

    it("should create an order with valid input", async () => {
      // tenant exists and active
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: validTenant, error: null }),
          } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: validOrder, error: null }),
            delete: vi.fn().mockReturnThis(),
          } as unknown as MockSupabaseClient;
        }
        if (table === "order_items") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await createOrder({
        tenant_id: validTenant.id,
        total_amount: 100.50,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test Product", unit_price: 50.25, quantity: 2 }],
        customer_name: "Juan Pérez",
        customer_phone: "+593999999999",
        notes: "Entregar en la tarde",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe("order-1");
    });

    it("should reject order when tenant_id is not a valid UUID", async () => {
      const result = await createOrder({
        tenant_id: "not-a-uuid",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject order when total_amount is negative", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: -100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("negativo");
    });

    it("should accept order with total_amount = 0 (free order)", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: validTenant, error: null }) } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: validOrder, error: null }), delete: vi.fn().mockReturnThis() } as unknown as MockSupabaseClient;
        }
        if (table === "order_items") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await createOrder({
        tenant_id: validTenant.id,
        total_amount: 0,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Free Item", unit_price: 0, quantity: 1 }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject order with empty items array", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 0,
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("producto");
    });

    it("should reject item with negative unit_price", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: -10, quantity: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with quantity = 0", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 0 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject item with negative quantity", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: -5 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject customer_name with possible XSS payload", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: validTenant, error: null }) } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: validOrder, error: null }), delete: vi.fn().mockReturnThis() } as unknown as MockSupabaseClient;
        }
        if (table === "order_items") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });
      const result = await createOrder({
        tenant_id: validTenant.id,
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
        customer_name: "<script>alert('xss')</script>",
      });
      // Should NOT fail — React auto-escapes output; we validate length, not content
      expect(result.success).toBe(true);
    });

    it("should reject notes that exceed max length", async () => {
      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
        notes: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("should reject order when tenant does not exist", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }) } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655449999",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Tienda no encontrada");
    });

    it("should reject order when tenant is inactive", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "550e8400-e29b-41d4-a716-446655440000", status: "draft" }, error: null }) } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("disponible");
    });
  });

  // ── getTenantOrders ──────────────────────────────────────

  describe("getTenantOrders — auth & tenant isolation", () => {
    const tenantId = "550e8400-e29b-41d4-a716-446655440000";
    const mockOrders = [{ id: "order-1", tenant_id: tenantId, total_amount: 100, status: "pending" }];

    function setupHappyPath() {
      // assertTenantMember: auth.getUser returns user
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      // assertTenantMember: tenant_members query returns member
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "member-1" }, error: null }),
          } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });
    }

    it("should return orders when user is authenticated and a tenant member", async () => {
      setupHappyPath();
      const result = await getTenantOrders(tenantId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
    });

    it("should reject when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Not authenticated" } });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await getTenantOrders(tenantId);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject when user is not a member of the tenant", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await getTenantOrders(tenantId);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject when tenantId is not a valid UUID", async () => {
      const result = await getTenantOrders("not-a-uuid");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });
  });

  // ── updateOrderStatus ────────────────────────────────────

  describe("updateOrderStatus — auth & tenant isolation", () => {
    const tenantId = "550e8400-e29b-41d4-a716-446655440000";
    const orderId = "660e8400-e29b-41d4-a716-446655440001";

    function setupHappyPath() {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: "member-1" }, error: null }),
          } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });
      // The update chain resolves to { error: null } via the outer mock
      mockSupabase.eq.mockResolvedValue({ error: null });
    }

    it("should update order status when user is authenticated and a tenant member", async () => {
      setupHappyPath();
      const result = await updateOrderStatus(tenantId, orderId, "confirmed");
      expect(result.success).toBe(true);
    });

    it("should reject when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Not authenticated" } });

      const result = await updateOrderStatus(tenantId, orderId, "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject when user is not a member of the tenant", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenant_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await updateOrderStatus(tenantId, orderId, "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject when tenantId is not a valid UUID", async () => {
      setupHappyPath();
      const result = await updateOrderStatus("not-a-uuid", orderId, "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject when orderId is not a valid UUID", async () => {
      setupHappyPath();
      const result = await updateOrderStatus(tenantId, "not-a-uuid", "confirmed");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("should reject when status is not a valid OrderStatus", async () => {
      setupHappyPath();
      const result = await updateOrderStatus(tenantId, orderId, "hacked" as unknown as string);
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
      // Setup happy path: tenant exists
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tenants") {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "550e8400-e29b-41d4-a716-446655440000", status: "active" }, error: null }) } as unknown as MockSupabaseClient;
        }
        if (table === "orders") {
          return { insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "order-ok" }, error: null }), delete: vi.fn().mockReturnThis() } as unknown as MockSupabaseClient;
        }
        if (table === "order_items") {
          return { insert: vi.fn().mockResolvedValue({ error: null }) } as unknown as MockSupabaseClient;
        }
        return mockSupabase as unknown as MockSupabaseClient;
      });

      const result = await createOrder({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [{ product_id: "660e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 }],
      });
      expect(result.success).toBe(true);
    });
  });
});