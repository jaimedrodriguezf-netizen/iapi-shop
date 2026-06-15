import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorefrontData } from "./actions";

// ── Mock setup with table-aware chaining ──────────────────────
// Track the current table so we can return different data per query
let currentTable = "";

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

const mockFrom = vi.fn((table: string) => {
  currentTable = table;
  return {
    select: vi.fn(function () {
      // For non-single queries, return the chain for .eq() / .order()
      return {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
        // Make the chain awaitable: returns mock data based on table
        then: vi.fn((resolve: (value: unknown) => void) => {
          if (currentTable === "categories") {
            resolve({
              data: [
                { id: "cat-1", name: "Bebidas", slug: "bebidas", parent_id: null },
                { id: "cat-2", name: "Postres", slug: "postres", parent_id: null },
              ],
              error: null,
            });
          } else if (currentTable === "products") {
            resolve({
              data: [
                { id: "prod-1", name: "Café", price: 2.50, is_active: true, categories: { name: "Bebidas" } },
                { id: "prod-2", name: "Pastel", price: 5.00, is_active: true, categories: { name: "Postres" } },
              ],
              error: null,
            });
          } else {
            resolve({ data: null, error: null });
          }
        }),
      };
    }),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

describe("getStorefrontData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Slug validation ───────────────────────────────────────────
  describe("slug validation", () => {
    it("rejects empty slug", async () => {
      const result = await getStorefrontData("");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("rejects slug with spaces", async () => {
      const result = await getStorefrontData("tienda con espacios");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("rejects slug with special characters", async () => {
      const result = await getStorefrontData("tienda@#$!");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("rejects slug with uppercase letters", async () => {
      const result = await getStorefrontData("Tienda-Test");
      expect(result.success).toBe(false);
      expect(result.error).toContain("inválido");
    });

    it("accepts valid kebab-case slug", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: "t1", name: "Test", slug: "mi-tienda", status: "active" },
        error: null,
      });

      const result = await getStorefrontData("mi-tienda");
      expect(result.success).toBe(true);
    });

    it("accepts simple lowercase slug", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: "t1", name: "Test", slug: "tienda", status: "active" },
        error: null,
      });

      const result = await getStorefrontData("tienda");
      expect(result.success).toBe(true);
    });
  });

  // ── Tenant not found ──────────────────────────────────────────
  describe("tenant not found", () => {
    it("returns error when tenant does not exist", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

      const result = await getStorefrontData("no-existe");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Sucursal no encontrada");
    });
  });

  // ── Active tenant with full data ──────────────────────────────
  describe("active tenant", () => {
    it("returns success with tenant and plan_name from subscription", async () => {
      const activeTenant = {
        id: "tenant-active-1",
        name: "Mi Tienda Activa",
        slug: "tienda-activa",
        status: "active",
        brand_color: "#f97316",
        secondary_color: "#bae6fd",
        whatsapp_phone: "+593999999999",
        logo_url: "https://example.com/logo.png",
        public_settings: { show_phone: true, show_address: true, show_social_links: true },
        address: { street: "Av. Principal", city: "Quito" },
        social_links: { instagram: "@mitienda" },
        created_at: "2025-01-01T00:00:00Z",
      };

      mockSingle.mockResolvedValueOnce({ data: activeTenant, error: null });
      mockMaybeSingle.mockResolvedValueOnce({
        data: { plan_name: "Starter" },
        error: null,
      });

      const result = await getStorefrontData("tienda-activa");

      expect(result.success).toBe(true);
      expect(result.tenant).toBeDefined();
      expect(result.tenant?.status).toBe("active");
      expect(result.tenant?.name).toBe("Mi Tienda Activa");
      expect(result.tenant?.plan_name).toBe("Starter");
      expect(result.tenant?.brand_color).toBe("#f97316");
    });

    it("returns categories and products for active tenant", async () => {
      const activeTenant = {
        id: "tenant-active-2",
        name: "Tienda",
        slug: "tienda-activa-2",
        status: "active",
      };

      mockSingle.mockResolvedValueOnce({ data: activeTenant, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getStorefrontData("tienda-activa-2");

      expect(result.success).toBe(true);
      expect(result.categories).toBeDefined();
      expect(result.products).toBeDefined();
    });
  });

  // ── Draft tenant ──────────────────────────────────────────────
  describe("draft tenant", () => {
    it("fetches draft tenant successfully (page shows construction message)", async () => {
      const draftTenant = {
        id: "tenant-draft-1",
        name: "Mi Tienda",
        slug: "tienda-draft",
        status: "draft",
      };

      mockSingle.mockResolvedValueOnce({ data: draftTenant, error: null });

      const result = await getStorefrontData("tienda-draft");

      expect(result.success).toBe(true);
      expect(result.tenant).toBeDefined();
      expect(result.tenant?.status).toBe("draft");
    });
  });

  // ── Tenant without subscription ───────────────────────────────
  describe("tenant without active subscription", () => {
    it("defaults plan_name to Free when no subscription found", async () => {
      const tenant = {
        id: "tenant-1",
        name: "Tienda Sin Plan",
        slug: "sin-plan",
        status: "active",
      };

      mockSingle.mockResolvedValueOnce({ data: tenant, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getStorefrontData("sin-plan");

      expect(result.success).toBe(true);
      expect(result.tenant?.plan_name).toBe("Free");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles tenant with null fields gracefully", async () => {
      const tenant = {
        id: "t-minimal",
        name: "Minimal",
        slug: "minimal",
        status: "active",
        brand_color: null,
        secondary_color: null,
        address: null,
        social_links: null,
        whatsapp_phone: null,
        logo_url: null,
        public_settings: null,
        created_at: "2025-01-01T00:00:00Z",
      };

      mockSingle.mockResolvedValueOnce({ data: tenant, error: null });

      const result = await getStorefrontData("minimal");

      expect(result.success).toBe(true);
      expect(result.tenant?.brand_color).toBeNull();
      expect(result.tenant?.whatsapp_phone).toBeNull();
    });

    it("handles subscription with null plans gracefully", async () => {
      const tenant = {
        id: "t-null-plan",
        name: "Null Plan",
        slug: "null-plan",
        status: "active",
      };

      mockSingle.mockResolvedValueOnce({ data: tenant, error: null });
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "sub-1", tenant_id: "t-null-plan", plans: null },
        error: null,
      });

      const result = await getStorefrontData("null-plan");

      expect(result.success).toBe(true);
      expect(result.tenant?.plan_name).toBe("Free");
    });
  });
});
