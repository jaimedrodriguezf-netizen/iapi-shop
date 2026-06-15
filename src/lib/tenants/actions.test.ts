import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTenant, checkSlugAvailability, updateTenantSettings, ensureUserTenant } from "./actions";

// Mock revalidatePath from next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock del cliente de Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
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

vi.mock("@/lib/rate-limit", () => ({
  tenantRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 2, remaining: 1, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  slugRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/auth/guards", () => ({
  assertTenantMember: vi.fn().mockResolvedValue({ ok: true as const }),
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

  it("should fail if user already has a tenant and does not have an active plus plan", async () => {
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

  it("should succeed if user already has a tenant but has an active plus plan", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    
    const mockExistingTenants = [{ id: "tenant-1" }];
    const mockSubs = [{ id: "sub-1", plans: { code: "plus" } }];

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

describe("Merchant Onboarding: checkSlugAvailability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should return available=true when slug is not taken", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await checkSlugAvailability("mi-tienda-nueva");

    expect(result.available).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return available=false when slug is already taken", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ slug: "tienda-existente" }], error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await checkSlugAvailability("tienda-existente");

    expect(result.available).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it("should reject invalid slug format (uppercase)", async () => {
    const result = await checkSlugAvailability("Mi_Tienda");

    expect(result.available).toBe(false);
    expect(result.error).toContain("Formato de slug inválido");
  });

  it("should reject invalid slug format (underscores)", async () => {
    const result = await checkSlugAvailability("mi_tienda");

    expect(result.available).toBe(false);
    expect(result.error).toContain("Formato de slug inválido");
  });

  it("should reject slug shorter than 2 characters", async () => {
    const result = await checkSlugAvailability("a");

    expect(result.available).toBe(false);
    expect(result.error).toContain("Formato de slug inválido");
  });

  it("should reject slug longer than 60 characters", async () => {
    const longSlug = "a".repeat(61);

    const result = await checkSlugAvailability(longSlug);

    expect(result.available).toBe(false);
    expect(result.error).toContain("Formato de slug inválido");
  });

  it("should fail if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await checkSlugAvailability("valid-slug");

    expect(result.available).toBe(false);
    expect(result.error).toBe("No autorizado");
  });
});

describe("Branding: updateTenantSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should update branding with valid input", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const mockUpdatedTenant = {
      id: "tenant-1",
      slug: "mi-tienda",
      brand_color: "#f97316",
      secondary_color: "#a78bfa",
      address: { street: "Calle 1", city: "Quito", state: "Pichincha", zip: "170150", country: "Ecuador" },
      social_links: { instagram: "https://instagram.com/example" },
    };

    vi.spyOn(mockSupabase, "from").mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedTenant, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await updateTenantSettings("tenant-1", {
      brand_color: "#f97316",
      secondary_color: "#a78bfa",
      address: { street: "Calle 1", city: "Quito", state: "Pichincha", zip: "170150", country: "Ecuador" },
      social_links: { instagram: "https://instagram.com/example" },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should update public_settings with valid input", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const mockUpdatedTenant = {
      id: "tenant-1",
      slug: "mi-tienda",
      public_settings: { show_phone: false, show_address: true, show_social_links: false },
    };

    vi.spyOn(mockSupabase, "from").mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedTenant, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await updateTenantSettings("tenant-1", {
      public_settings: { show_phone: false, show_address: true, show_social_links: false },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.public_settings).toEqual({
      show_phone: false,
      show_address: true,
      show_social_links: false,
    });
  });

  it("should update public_settings with all values true (triangulation)", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const mockUpdatedTenant = {
      id: "tenant-1",
      slug: "mi-tienda",
      public_settings: { show_phone: true, show_address: true, show_social_links: true },
    };

    vi.spyOn(mockSupabase, "from").mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedTenant, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await updateTenantSettings("tenant-1", {
      public_settings: { show_phone: true, show_address: true, show_social_links: true },
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.public_settings).toEqual({
      show_phone: true,
      show_address: true,
      show_social_links: true,
    });
  });



  it("should reject invalid brand_color format", async () => {
    const result = await updateTenantSettings("tenant-1", {
      brand_color: "notacolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid brand_color format");
  });

  it("should reject invalid secondary_color format", async () => {
    const result = await updateTenantSettings("tenant-1", {
      secondary_color: "bad-color",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid secondary_color format");
  });

  it("should accept null values to clear branding fields", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    vi.spyOn(mockSupabase, "from").mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "tenant-1", slug: "mi-tienda" }, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await updateTenantSettings("tenant-1", {
      brand_color: null,
      secondary_color: null,
      address: null,
      social_links: null,
    });

    expect(result.success).toBe(true);
  });

  it("should fail when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await updateTenantSettings("tenant-1", {
      brand_color: "#f97316",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No autorizado");
  });

  it("should accept valid 6-digit hex colors", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    vi.spyOn(mockSupabase, "from").mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "tenant-1", slug: "mi-tienda" }, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await updateTenantSettings("tenant-1", {
      brand_color: "#22c55e",
    });

    expect(result.success).toBe(true);
  });

  it("should reject hex colors without # prefix", async () => {
    const result = await updateTenantSettings("tenant-1", {
      brand_color: "22c55e",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid brand_color format");
  });

  it("should reject 3-digit hex shorthand", async () => {
    const result = await updateTenantSettings("tenant-1", {
      brand_color: "#fff",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid brand_color format");
  });

  it("should reject publishing if name is default 'Mi Tienda'", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "tenant-1", name: "Mi Tienda", slug: "mi-slug-pro", status: "draft" },
            error: null
          }),
        };
      }
      return mockSupabase;
    });
    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await updateTenantSettings("tenant-1", {
      status: "active"
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No se puede publicar la tienda con el nombre por defecto");
  });

  it("should reject publishing if slug starts with 'tienda-'", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "tenant-1", name: "Mi Tienda Custom", slug: "tienda-abcde", status: "draft" },
            error: null
          }),
        };
      }
      return mockSupabase;
    });
    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await updateTenantSettings("tenant-1", {
      status: "active"
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No se puede publicar la tienda con un slug por defecto");
  });

  it("should reject update if slug is already in use by another tenant", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        const queryBuilder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
        };

        queryBuilder.single.mockResolvedValue({
          data: { id: "tenant-1", name: "Mi Tienda", slug: "mi-slug-old", status: "draft" },
          error: null
        });
        
        queryBuilder.maybeSingle.mockResolvedValue({
          data: { id: "tenant-2", slug: "mi-slug-new" },
          error: null
        });

        return queryBuilder;
      }
      return mockSupabase;
    });
    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await updateTenantSettings("tenant-1", {
      slug: "mi-slug-new"
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("El slug ya está en uso");
  });

  it("should succeed in publishing if name and slug are customized", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({
            data: { id: "tenant-1", name: "Mi Tienda Custom", slug: "mi-tienda-custom", status: "active" },
            error: null
          }),
          update: vi.fn().mockReturnThis(),
        };
      }
      return mockSupabase;
    });
    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await updateTenantSettings("tenant-1", {
      status: "active",
      name: "Mi Tienda Custom",
      slug: "mi-tienda-custom"
    });

    expect(result.success).toBe(true);
  });
});

describe("ensureUserTenant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should return the existing tenant if one exists", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const existing = { id: "tenant-exist", name: "Mi Tienda", slug: "tienda-exist", created_by: "user-123", status: "active" };

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
        };
      }
      return mockSupabase;
    });

    vi.spyOn(mockSupabase, "from").mockImplementation(fromMock);

    const result = await ensureUserTenant();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe("tenant-exist");
  });

  it("should create a new default tenant in draft status when none exists", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: "new-tenant", name: "Mi Tienda", slug: "tienda-abcde", status: "draft" }, error: null }),
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

    const result = await ensureUserTenant();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe("Mi Tienda");
    expect(result.data?.status).toBe("draft");
    expect(result.data?.slug).toMatch(/^tienda-[a-z0-9]{5}$/);
  });

  it("should fail if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await ensureUserTenant();

    expect(result.success).toBe(false);
    expect(result.error).toBe("No autorizado");
  });
});

describe("Zod input validation", () => {
  describe("createTenant", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.clearAllMocks();
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    });

    it("rejects empty name", async () => {
      const result = await createTenant({ name: "", slug: "my-slug" });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 100 characters", async () => {
      const result = await createTenant({ name: "a".repeat(101), slug: "my-slug" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid slug format with uppercase", async () => {
      const result = await createTenant({ name: "My Store", slug: "My-Store" });
      expect(result.success).toBe(false);
    });

    it("rejects slug with underscores", async () => {
      const result = await createTenant({ name: "My Store", slug: "my_store" });
      expect(result.success).toBe(false);
    });

    it("rejects whatsapp_phone longer than 20 characters", async () => {
      const result = await createTenant({
        name: "My Store",
        slug: "my-store",
        whatsapp_phone: "a".repeat(21),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTenantSettings", () => {
    it("rejects invalid status value", async () => {
      const result = await updateTenantSettings("tenant-1", { status: "hacked" as unknown as "draft" | "active" | "suspended" });
      expect(result.success).toBe(false);
    });
  });
});
