import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct, getProducts, updateProduct, deleteProduct, getCategories, createCategory, uploadProductImage, checkProductLimit, getTags } from "./actions";
import { uploadRateLimit } from "@/lib/rate-limit";

interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  storage: unknown;
  [key: string]: unknown;
}

// Shared mock factory — each test creates fresh instances
function createMockSupabase(overrides: Record<string, unknown> = {}): MockSupabaseClient {
  const mock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }),
    },
    from: vi.fn(),
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    storage: undefined as unknown,
  } as unknown as MockSupabaseClient;

  mock.from.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.or.mockReturnValue(mock);
  mock.maybeSingle.mockReturnValue(mock);

  Object.assign(mock, overrides);
  // Re-link chainable returns after overrides
  mock.from.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.or.mockReturnValue(mock);
  mock.maybeSingle.mockReturnValue(mock);

  return mock;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/tenants/actions", () => ({
  getTenantSubscription: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  assertTenantMember: vi.fn().mockResolvedValue({ ok: true as const }),
}));

vi.mock("@/lib/rate-limit", () => ({
  uploadRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  productRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 30, remaining: 29, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  categoryRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

import { createClient } from "@/lib/supabase/server";
import { getTenantSubscription } from "@/lib/tenants/actions";

// Minimal valid PNG bytes for upload tests (8-byte PNG signature)
const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);

describe("Product Catalog Actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadRateLimit.limit).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000, pending: Promise.resolve() });
    mockSupabase = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  describe("createProduct", () => {
    it("should create a product and its images", async () => {
      // Make checkProductLimit pass
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });
      // Mock count query to return under limit
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValue({ eq: mockEq });
      // After checkProductLimit, the insert chain
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Test" }, error: null });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Test",
        slug: "producto-test",
        price: 10.50,
        image_urls: ["http://image1.jpg"],
      });

      expect(result.success).toBe(true);
    });

    it("should auto-generate slug if not provided", async () => {
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Test Auto Slug" }, error: null });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Test Auto Slug",
        price: 10.50,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        slug: "producto-test-auto-slug",
      }));
    });

    it("should handle empty category_id string by converting it to null", async () => {
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Cat Test" }, error: null });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Cat Test",
        price: 10.50,
        category_id: "",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        category_id: null,
      }));
    });

    it("should create a product with compare_at_price", async () => {
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Descuento", compare_at_price: 15.00 }, error: null });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Descuento",
        price: 10.00,
        compare_at_price: 15.00,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        compare_at_price: 15.00,
      }));
    });

    it("should default compare_at_price to null when not provided", async () => {
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-2", name: "Producto Sin Descuento" }, error: null });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Sin Descuento",
        price: 10.00,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        compare_at_price: null,
      }));
    });
  });

  describe("getProducts", () => {
    it("should fetch products and sort/map their images into image_urls", async () => {
      const mockProducts = [
        {
          id: "prod-1",
          name: "Producto Test 1",
          price: 10,
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          categories: { name: "Bebidas" },
          product_images: [
            { url: "img2.jpg", display_order: 1 },
            { url: "img1.jpg", display_order: 0 },
          ],
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({ data: mockProducts, error: null });

      const result = await getProducts("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
      expect(result.products?.[0].image_urls).toEqual(["img1.jpg", "img2.jpg"]);
    });
  });

  describe("updateProduct", () => {
    it("should update product details", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", "550e8400-e29b-41d4-a716-446655440000", {
        name: "Producto Actualizado",
        price: 15.00,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "550e8400-e29b-41d4-a716-446655440000");
    });

    it("should auto-generate slug if name is updated and slug is not provided", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Actualizado Auto Slug" }, error: null });

      const result = await updateProduct("prod-1", "550e8400-e29b-41d4-a716-446655440000", {
        name: "Producto Actualizado Auto Slug",
        price: 15.00,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        slug: "producto-actualizado-auto-slug",
      }));
    });

    it("should handle empty category_id string by converting it to null on update", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", "550e8400-e29b-41d4-a716-446655440000", {
        category_id: "",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        category_id: null,
      }));
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product", async () => {
      const result = await deleteProduct("prod-1", "550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("Categories", () => {
    it("should fetch categories for a tenant", async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({ data: [], error: null });
      const result = await getCategories("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(mockSupabase.or).toHaveBeenCalledWith("tenant_id.eq.550e8400-e29b-41d4-a716-446655440000,tenant_id.is.null");
    });

    it("should create a new category", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: { plans: { name: "Pro" } }, error: null });
      mockSupabase.single.mockResolvedValue({ data: { id: "cat-1", name: "Bebidas" }, error: null });
      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Bebidas");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Bebidas");
    });

    it("should create a subcategory with a parent_id", async () => {
      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "660e8400-e29b-41d4-a716-446655440001", parent_id: null }, error: null });
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({ data: { id: "cat-2", name: "Calientes", parent_id: "660e8400-e29b-41d4-a716-446655440001" }, error: null });
      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Calientes", "660e8400-e29b-41d4-a716-446655440001");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Calientes");
      expect(result.category?.parent_id).toBe("660e8400-e29b-41d4-a716-446655440001");
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        parent_id: "660e8400-e29b-41d4-a716-446655440001",
      }));
    });

    it("should allow a paid merchant to create a Level 1 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: { plans: { name: "Pro" } }, error: null });
      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-1", name: "Bebidas", parent_id: null },
        error: null,
      });

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Bebidas");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Bebidas");
      expect(result.category?.parent_id).toBeNull();
    });

    it("should allow a paid merchant to create a Level 2 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "660e8400-e29b-41d4-a716-446655440001", parent_id: null }, error: null }); // parent check (Level 1 parent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-2", name: "Calientes", parent_id: "660e8400-e29b-41d4-a716-446655440001" },
        error: null,
      });

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Calientes", "660e8400-e29b-41d4-a716-446655440001");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Calientes");
      expect(result.category?.parent_id).toBe("660e8400-e29b-41d4-a716-446655440001");
    });

    it("should allow a paid merchant to create a Level 3 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "660e8400-e29b-41d4-a716-446655440001", parent_id: "770e8400-e29b-41d4-a716-446655440002" }, error: null }); // parent check (Level 2 parent)
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "770e8400-e29b-41d4-a716-446655440002", parent_id: null }, error: null }); // grandparent check (Level 1 grandparent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-3", name: "Tercer Nivel", parent_id: "660e8400-e29b-41d4-a716-446655440001" },
        error: null,
      });

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Tercer Nivel", "660e8400-e29b-41d4-a716-446655440001");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Tercer Nivel");
      expect(result.category?.parent_id).toBe("660e8400-e29b-41d4-a716-446655440001");
    });

    it("should reject creating a Level 4 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "660e8400-e29b-41d4-a716-446655440001", parent_id: "770e8400-e29b-41d4-a716-446655440002" }, error: null }); // parent check (Level 3 parent)
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "770e8400-e29b-41d4-a716-446655440002", parent_id: "880e8400-e29b-41d4-a716-446655440003" }, error: null }); // grandparent check (Level 2 grandparent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Cuarto Nivel", "660e8400-e29b-41d4-a716-446655440001");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No se puede agregar una categoría en este nivel (límite de 3 niveles jerárquicos).");
    });

    it("should reject creating a category if the plan is Free", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: { plans: { name: "Free" } }, error: null });

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Bebidas");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Tu plan no permite crear categorías.");
    });

    it("should allow an admin to create a Level 1 category even without plan check", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "admin-123", email: "admin@iapi.shop" } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-admin", name: "Admin Cat", parent_id: null },
        error: null,
      });

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Admin Cat");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Admin Cat");
    });

    it("should reject creating a category if parent category does not exist", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // parent check (not found)
      mockSupabase.maybeSingle = mockMaybeSingle;

      const result = await createCategory("550e8400-e29b-41d4-a716-446655440000", "Calientes", "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
      expect(result.success).toBe(false);
      expect(result.error).toBe("La categoría padre especificada no existe.");
    });
  });

  describe("uploadProductImage", () => {

    it("should upload a product image successfully", async () => {
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: { path: "path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://supabase.com/pic.png" } }),
      };

      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      } as unknown as typeof mockSupabase.storage;

      const formData = new FormData();
      const file = new File([pngBytes], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://supabase.com/pic.png");
    });

    it("should return failure when storage upload fails", async () => {
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "Storage error" } }),
      };

      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      } as unknown as typeof mockSupabase.storage;

      const formData = new FormData();
      const file = new File([pngBytes], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(false);
      // The action now returns a generic upload error message
      expect(result.error).toContain("Error al subir");
    });
  });

  describe("checkProductLimit", () => {
    it("should allow creation when under the limit", async () => {
      // Mock the count query chain for checkProductLimit
      const mockEq = vi.fn().mockResolvedValue({ count: 2, error: null });
      mockSupabase.select.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSupabase.select });

      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });

      const result = await checkProductLimit("550e8400-e29b-41d4-a716-446655440000");
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(5);
    });

    it("should block creation when at the limit", async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 5, error: null });
      mockSupabase.select.mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ select: mockSupabase.select });

      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 5 } },
      });

      const result = await checkProductLimit("550e8400-e29b-41d4-a716-446655440000");
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(5);
      expect(result.limit).toBe(5);
      expect(result.error).toContain("5");
    });
  });

  describe("createProduct with plan limit", () => {
    it("should reject creation when plan limit is reached", async () => {
      // checkProductLimit will check count and find we're at limit
      const mockEq = vi.fn().mockResolvedValue({ count: 10, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq });
      mockSupabase.from.mockReturnValueOnce({ select: mockSupabase.select });
      // Ensure subsequent from() calls also work
      mockSupabase.from.mockReturnValue(mockSupabase);

      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "550e8400-e29b-41d4-a716-446655440000", plans: { name: "Free", product_limit: 10 } },
      });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Producto Limitado",
        price: 15.00,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("límite");
    });
  });

  describe("rate limiting on uploadProductImage", () => {
    it("blocks upload when rate limit is exceeded", async () => {
      vi.mocked(uploadRateLimit.limit).mockResolvedValueOnce({
        success: false, limit: 5, remaining: 0, reset: Date.now() + 60000, pending: Promise.resolve(),
      });

      const formData = new FormData();
      const file = new File([pngBytes], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Demasiadas subidas");
    });

    it("allows upload when under rate limit", async () => {
      vi.mocked(uploadRateLimit.limit).mockResolvedValueOnce({
        success: true, limit: 5, remaining: 4, reset: Date.now() + 60000, pending: Promise.resolve(),
      });

      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: { path: "path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://supabase.com/pic.png" } }),
      };

      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      } as unknown as typeof mockSupabase.storage;

      const formData = new FormData();
      const file = new File([pngBytes], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://supabase.com/pic.png");
    });
  });

  describe("Zod input validation", () => {
    describe("createProduct", () => {
      it("rejects empty product name", async () => {
        const result = await createProduct({
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "",
          price: 100,
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain("nombre");
      });

      it("rejects name longer than 200 characters", async () => {
        const result = await createProduct({
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "a".repeat(201),
          price: 100,
        });
        expect(result.success).toBe(false);
      });

      it("rejects negative price", async () => {
        const result = await createProduct({
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Product",
          price: -10,
        });
        expect(result.success).toBe(false);
      });

      it("rejects non-UUID tenant_id", async () => {
        const result = await createProduct({
          tenant_id: "not-a-uuid",
          name: "Test Product",
          price: 100,
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain("inválido");
      });

      it("rejects more than 6 image_urls", async () => {
        const result = await createProduct({
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Product",
          price: 100,
          image_urls: ["url1", "url2", "url3", "url4", "url5", "url6", "url7"],
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain("6");
      });

      it("rejects description longer than 2000 characters", async () => {
        const result = await createProduct({
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Product",
          price: 100,
          description: "a".repeat(2001),
        });
        expect(result.success).toBe(false);
      });
    });

    describe("createCategory", () => {
      it("rejects empty category name", async () => {
        const result = await createCategory(
          "550e8400-e29b-41d4-a716-446655440000",
          ""
        );
        expect(result.success).toBe(false);
        expect(result.error).toContain("nombre");
      });

      it("rejects name longer than 100 characters", async () => {
        const result = await createCategory(
          "550e8400-e29b-41d4-a716-446655440000",
          "a".repeat(101)
        );
        expect(result.success).toBe(false);
      });

      it("rejects non-UUID tenant_id", async () => {
        const result = await createCategory("not-a-uuid", "Valid Name");
        expect(result.success).toBe(false);
        expect(result.error).toContain("inválido");
      });
    });

    describe("uploadProductImage", () => {
      it("rejects non-image file types", async () => {
        vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);

        const formData = new FormData();
        formData.append("file", new File(["fake-exe"], "malware.exe", { type: "application/x-msdownload" }));
        formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

        const result = await uploadProductImage(formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Tipo de archivo");
      });

      it("rejects files larger than 5MB", async () => {
        vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);

        const largeBuffer = new Uint8Array(6 * 1024 * 1024); // 6MB
        const formData = new FormData();
        formData.append("file", new File([largeBuffer], "big-image.png", { type: "image/png" }));
        formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

        const result = await uploadProductImage(formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain("5MB");
      });

      it("rejects non-UUID tenantId", async () => {
        const formData = new FormData();
        formData.append("file", new File(["foo"], "photo.png", { type: "image/png" }));
        formData.append("tenantId", "not-a-uuid");

        const result = await uploadProductImage(formData);
        expect(result.success).toBe(false);
        expect(result.error).toContain("inválido");
      });
    });
  });

  describe("uploadProductImage security", () => {
    it("should reject an executable file renamed to .png (magic byte mismatch)", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: true as const });

      // DOS/PE executable header (MZ) — does NOT match PNG magic bytes
      const exeHeader = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff]);
      const file = new File([exeHeader], "malware.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/tipo de archivo|no coincide|no se pudo/i);
    });

    it("should reject a file without authentication", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const file = new File(["fake png data"], "photo.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject upload for a tenant the user does not belong to", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const file = new File([pngHeader], "photo.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", "550e8400-e29b-41d4-a716-446655440000");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });
  });

  describe("Tenant membership guard on product actions", () => {
    it("should reject getProducts when user is not a tenant member", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const result = await getProducts("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject getCategories when user is not a tenant member", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const result = await getCategories("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject getTags when user is not a tenant member", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const result = await getTags("550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });

    it("should reject createProduct when user is not a tenant member", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const result = await createProduct({
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Unauthorized Product",
        price: 10,
      });
      // createProduct validates via Zod first, then checks auth
      // The membership check happens inside checkProductLimit
      expect(result.success).toBe(false);
    });

    it("should reject deleteProduct when user is not a tenant member", async () => {
      const { assertTenantMember } = await import("@/lib/auth/guards");
      vi.mocked(assertTenantMember).mockResolvedValueOnce({ ok: false, error: "No autorizado" });

      const result = await deleteProduct("prod-1", "550e8400-e29b-41d4-a716-446655440000");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No autorizado");
    });
  });
});