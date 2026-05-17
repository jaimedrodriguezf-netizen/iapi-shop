import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct, updateProduct, deleteProduct, getCategories, createCategory } from "./actions";

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
  });

  describe("updateProduct", () => {
    it("should update product details", async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: "prod-1", name: "Updated" }, error: null });

      const result = await updateProduct("prod-1", {
        name: "Producto Actualizado",
        price: 15.00
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product", async () => {
      const result = await deleteProduct("prod-1");
      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "prod-1");
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
});
