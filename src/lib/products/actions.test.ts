import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct, getProducts, updateProduct, deleteProduct, getCategories, createCategory, uploadProductImage, checkProductLimit } from "./actions";

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
  mock.maybeSingle.mockReturnValue(mock);

  Object.assign(mock, overrides);
  // Re-link chainable returns after overrides
  mock.from.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.maybeSingle.mockReturnValue(mock);

  return mock;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/tenants/actions", () => ({
  getTenantSubscription: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { getTenantSubscription } from "@/lib/tenants/actions";

describe("Product Catalog Actions", () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  describe("createProduct", () => {
    it("should create a product and its images", async () => {
      // Make checkProductLimit pass
      vi.mocked(getTenantSubscription).mockResolvedValue({
        success: true,
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 5 } },
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
        tenant_id: "tenant-123",
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
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Test Auto Slug" }, error: null });

      const result = await createProduct({
        tenant_id: "tenant-123",
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
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 5 } },
      });
      const mockEq = vi.fn().mockResolvedValue({ count: 0, error: null });
      mockSupabase.select.mockReturnValueOnce({ eq: mockEq }).mockReturnValue(mockSupabase);
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Cat Test" }, error: null });

      const result = await createProduct({
        tenant_id: "tenant-123",
        name: "Producto Cat Test",
        price: 10.50,
        category_id: "",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        category_id: null,
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
          tenant_id: "tenant-123",
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

      const result = await getProducts("tenant-123");
      expect(result.success).toBe(true);
      expect(result.products?.[0].image_urls).toEqual(["img1.jpg", "img2.jpg"]);
    });
  });

  describe("updateProduct", () => {
    it("should update product details", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", "tenant-123", {
        name: "Producto Actualizado",
        price: 15.00,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "tenant-123");
    });

    it("should auto-generate slug if name is updated and slug is not provided", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Actualizado Auto Slug" }, error: null });

      const result = await updateProduct("prod-1", "tenant-123", {
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

      const result = await updateProduct("prod-1", "tenant-123", {
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
      const result = await deleteProduct("prod-1", "tenant-123");
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "tenant-123");
    });
  });

  describe("Categories", () => {
    it("should fetch categories for a tenant", async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({ data: [], error: null });
      const result = await getCategories("tenant-123");
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "tenant-123");
    });

    it("should create a new category", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: { plans: { name: "Pro" } }, error: null });
      mockSupabase.single.mockResolvedValue({ data: { id: "cat-1", name: "Bebidas" }, error: null });
      const result = await createCategory("tenant-123", "Bebidas");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Bebidas");
    });

    it("should create a subcategory with a parent_id", async () => {
      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null });
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "cat-1", parent_id: null }, error: null });
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({ data: { id: "cat-2", name: "Calientes", parent_id: "cat-1" }, error: null });
      const result = await createCategory("tenant-123", "Calientes", "cat-1");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Calientes");
      expect(result.category?.parent_id).toBe("cat-1");
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        parent_id: "cat-1",
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

      const result = await createCategory("tenant-123", "Bebidas");
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
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "parent-id", parent_id: null }, error: null }); // parent check (Level 1 parent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-2", name: "Calientes", parent_id: "parent-id" },
        error: null,
      });

      const result = await createCategory("tenant-123", "Calientes", "parent-id");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Calientes");
      expect(result.category?.parent_id).toBe("parent-id");
    });

    it("should allow a paid merchant to create a Level 3 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "parent-id", parent_id: "grandparent-id" }, error: null }); // parent check (Level 2 parent)
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "grandparent-id", parent_id: null }, error: null }); // grandparent check (Level 1 grandparent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      mockSupabase.single.mockResolvedValue({
        data: { id: "cat-3", name: "Tercer Nivel", parent_id: "parent-id" },
        error: null,
      });

      const result = await createCategory("tenant-123", "Tercer Nivel", "parent-id");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Tercer Nivel");
      expect(result.category?.parent_id).toBe("parent-id");
    });

    it("should reject creating a Level 4 category", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      const mockMaybeSingle = vi.fn();
      mockMaybeSingle.mockResolvedValueOnce({ data: { plans: { name: "Pro" } }, error: null }); // plan check
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "parent-id", parent_id: "grandparent-id" }, error: null }); // parent check (Level 3 parent)
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: "grandparent-id", parent_id: "great-grandparent-id" }, error: null }); // grandparent check (Level 2 grandparent)
      mockSupabase.maybeSingle = mockMaybeSingle;

      const result = await createCategory("tenant-123", "Cuarto Nivel", "parent-id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("No se puede agregar una categoría en este nivel (límite de 3 niveles jerárquicos).");
    });

    it("should reject creating a category if the plan is Free", async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "merchant@example.com" } },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: { plans: { name: "Free" } }, error: null });

      const result = await createCategory("tenant-123", "Bebidas");
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

      const result = await createCategory("tenant-123", "Admin Cat");
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

      const result = await createCategory("tenant-123", "Calientes", "non-existent-parent");
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
      const file = new File(["foo"], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "tenant-123");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://supabase.com/pic.png");
    });

    it("should fallback to base64 when storage upload fails", async () => {
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "Storage error" } }),
      };

      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      } as unknown as typeof mockSupabase.storage;

      const formData = new FormData();
      const file = new File(["foo"], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "tenant-123");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.url).toContain("data:image/png;base64,");
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
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 5 } },
      });

      const result = await checkProductLimit("tenant-123");
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
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 5 } },
      });

      const result = await checkProductLimit("tenant-123");
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
        data: { id: "sub-1", tenant_id: "tenant-123", plans: { name: "Free", product_limit: 10 } },
      });

      const result = await createProduct({
        tenant_id: "tenant-123",
        name: "Producto Limitado",
        price: 15.00,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("límite");
    });
  });
});