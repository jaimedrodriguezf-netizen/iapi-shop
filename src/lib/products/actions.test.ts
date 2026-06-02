import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct, updateProduct, deleteProduct, getCategories, createCategory, uploadProductImage } from "./actions";

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  storage: undefined as { from: ReturnType<typeof vi.fn> } | undefined,
};

mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.insert.mockReturnValue(mockSupabase);
mockSupabase.update.mockReturnValue(mockSupabase);
mockSupabase.delete.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.order.mockReturnValue(mockSupabase);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Product Catalog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
  });

  describe("createProduct", () => {
    it("should create a product and its images", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Test" }, error: null });

      const result = await createProduct({
        tenant_id: "tenant-123",
        name: "Producto Test",
        slug: "producto-test",
        price: 10.50,
        image_urls: ["http://image1.jpg"]
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
      expect(mockSupabase.from).toHaveBeenCalledWith("product_images");
    });

    it("should auto-generate slug if not provided", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Test Auto Slug" }, error: null });

      const result = await createProduct({
        tenant_id: "tenant-123",
        name: "Producto Test Auto Slug",
        price: 10.50,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        slug: "producto-test-auto-slug"
      }));
    });

    it("should handle empty category_id string by converting it to null", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Producto Cat Test" }, error: null });

      const result = await createProduct({
        tenant_id: "tenant-123",
        name: "Producto Cat Test",
        price: 10.50,
        category_id: "",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        category_id: null
      }));
    });
  });

  describe("updateProduct", () => {
    it("should update product details", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", "tenant-123", {
        name: "Producto Actualizado",
        price: 15.00
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
        price: 15.00
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        slug: "producto-actualizado-auto-slug"
      }));
    });

    it("should handle empty category_id string by converting it to null on update", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", "tenant-123", {
        category_id: "",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        category_id: null
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
      const result = await getCategories("tenant-123");
      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("categories");
      expect(mockSupabase.eq).toHaveBeenCalledWith("tenant_id", "tenant-123");
    });

    it("should create a new category", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "cat-1", name: "Bebidas" }, error: null });
      const result = await createCategory("tenant-123", "Bebidas");
      expect(result.success).toBe(true);
      expect(result.category?.name).toBe("Bebidas");
    });
  });

  describe("uploadProductImage", () => {
    it("should upload a product image successfully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
      
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: { path: "path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "http://supabase.com/pic.png" } }),
      };
      
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      };

      const formData = new FormData();
      const file = new File(["foo"], "photo.png", { type: "image/png" });
      formData.append("file", file);
      formData.append("tenantId", "tenant-123");

      const result = await uploadProductImage(formData);
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://supabase.com/pic.png");
    });

    it("should fallback to base64 when storage upload fails", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
      
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: null, error: { message: "Storage error" } }),
      };
      
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue(mockStorage),
      };

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
});
