import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductFormModal } from "./product-form-modal";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { createCategory } from "@/lib/products/actions";

// Mock de acciones de servidor de productos
vi.mock("@/lib/products/actions", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  getCategories: vi.fn().mockResolvedValue({ success: true, categories: [] }),
  createCategory: vi.fn(),
}));

describe("ProductFormModal Accessibility and Typography", () => {
  it("verifies form control accessibility and proper typographic ellipses", async () => {
    const handleOpenChange = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <ProductFormModal 
        tenantId="tenant-123" 
        product={null} 
        open={true} 
        onOpenChange={handleOpenChange} 
        onSuccess={handleSuccess} 
      />
    );

    // 1. Verificar elipsis en el placeholder de la descripción
    const descInput = screen.getByPlaceholderText(/describe tu producto…/i);
    expect(descInput).toBeInTheDocument();

    // Cambiar a la pestaña de fotos (media)
    const user = userEvent.setup();
    const mediaTab = screen.getByRole("tab", { name: /fotos/i });
    await user.click(mediaTab);

    // 2. Verificar que exista la opción de subir fotos desde el dispositivo
    const uploadInput = screen.getByText(/subir foto 1/i);
    expect(uploadInput).toBeInTheDocument();

    // Cambiar a la pestaña de categoría
    const catTab = screen.getByRole("tab", { name: /categoría/i });
    await user.click(catTab);

    // 3. Verificar que el input de nueva categoría tenga aria-label accesible
    const newCatInput = screen.getByLabelText(/nombre de la nueva categoría/i);
    expect(newCatInput).toBeInTheDocument();

    // 4. Testear fallo de creación de categoría y feedback visual con toast.error
    const toastErrorSpy = vi.spyOn(toast, "error");
    const createCategoryMock = vi.mocked(createCategory);
    createCategoryMock.mockResolvedValue({ success: false, category: undefined, error: "Error al crear categoría" });

    await user.type(newCatInput, "Postres Exclusivos");
    const createBtn = screen.getByRole("button", { name: /crear/i });
    await user.click(createBtn);

    expect(createCategoryMock).toHaveBeenCalledWith("tenant-123", "Postres Exclusivos");
    expect(toastErrorSpy).toHaveBeenCalledWith("Error al crear categoría");
  });
});
