import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTenant } from "./actions";

// Mock del cliente de Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.in.mockReturnValue(mockSupabase);

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

describe("Merchant Onboarding: createTenant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should create a tenant if user has no existing tenants", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "tenant-456", slug: "tienda-test" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "plans") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "plan-free" }, error: null }),
        };
      }
      if (table === "tenant_subscriptions") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await createTenant({
      name: "Mi Tienda TDD",
      slug: "tienda-test",
      whatsapp_phone: "+593999999999"
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.slug).toBe("tienda-test");
  });

  it("should fail if user already has a tenant and does not have an active business plan", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    
    const mockExistingTenants = [{ id: "tenant-1" }];
    const mockSubs = [{ id: "sub-1", plans: { code: "free" } }];

    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockExistingTenants, error: null }),
        };
      }
      if (table === "tenant_subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockSubs, error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await createTenant({
      name: "Segunda Tienda Falla",
      slug: "tienda-2"
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("El plan actual solo permite tener una sucursal");
  });

  it("should succeed if user already has a tenant but has an active business plan", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    
    const mockExistingTenants = [{ id: "tenant-1" }];
    const mockSubs = [{ id: "sub-1", plans: { code: "business" } }];

    const fromMock = vi.fn().mockImplementation((table) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockExistingTenants, error: null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "tenant-789", slug: "tienda-3" }, error: null }),
        };
      }
      if (table === "tenant_subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: mockSubs, error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "plans") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "plan-free" }, error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await createTenant({
      name: "Tercera Tienda Exito",
      slug: "tienda-3"
    });

    expect(result.success).toBe(true);
    expect(result.data?.slug).toBe("tienda-3");
  });

  it("should fail if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await createTenant({
      name: "Tienda Error",
      slug: "error-slug"
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No autorizado");
  });
});
