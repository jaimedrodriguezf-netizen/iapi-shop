import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTenant } from "./actions";

// Mock del cliente de Supabase con encadenamiento funcional
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

// Configuración de mocks encadenados
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.insert.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Merchant Onboarding: createTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a tenant and assign the creator as owner", async () => {
    // Setup mocks
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    
    // Configuramos respuestas secuenciales para .single()
    mockSupabase.single
      .mockResolvedValueOnce({ data: { id: "tenant-456", slug: "tienda-test" }, error: null }) // insert tenant
      .mockResolvedValueOnce({ data: { id: "plan-free" }, error: null }); // select plan

    // Mock para inserts intermedios que no usan single
    mockSupabase.insert.mockReturnValue(mockSupabase);

    const result = await createTenant({
      name: "Mi Tienda TDD",
      slug: "tienda-test",
      whatsapp_phone: "+593999999999"
    });

    expect(result.success).toBe(true);
    expect(result.tenant?.slug).toBe("tienda-test");
    expect(mockSupabase.from).toHaveBeenCalledWith("tenants");
    expect(mockSupabase.from).toHaveBeenCalledWith("tenant_members");
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
