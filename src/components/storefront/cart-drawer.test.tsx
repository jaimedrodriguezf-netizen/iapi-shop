import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartDrawer } from "./cart-drawer";
import { useCart } from "@/lib/storefront/cart-store";
import userEvent from "@testing-library/user-event";

// Mock de la acción de servidor para evitar llamadas reales a Supabase
vi.mock("@/lib/orders/actions", () => ({
  createOrder: vi.fn().mockResolvedValue({ success: true, data: "order-123456" }),
}));

describe("CartDrawer Accessibility and Typography", () => {
  it("contains appropriate aria-labels and typographic formatting in all states", async () => {
    // Inicializar el carrito con un producto
    useCart.getState().addItem("tenant-123", {
      id: "prod-1",
      name: "Hamburguesa Vegana",
      price: 12.50,
      image_url: "https://example.com/hamb.jpg",
    });

    render(
      <CartDrawer 
        whatsapp="+593999999999" 
        tenantName="Burger Shop" 
        tenantId="tenant-123" 
      />
    );

    // 1. Verificar trigger principal
    const cartButton = screen.getByRole("button", { name: /abrir carrito/i });
    expect(cartButton).toBeInTheDocument();
    expect(cartButton).toHaveAttribute("aria-label", "Abrir carrito");

    // Abrir el Drawer
    const user = userEvent.setup();
    await user.click(cartButton);

    // 2. Verificar que se renderizan los controles del item del carrito con aria-labels
    const decreaseBtn = screen.getByRole("button", { name: /disminuir cantidad/i });
    expect(decreaseBtn).toBeInTheDocument();

    const increaseBtn = screen.getByRole("button", { name: /incrementar cantidad/i });
    expect(increaseBtn).toBeInTheDocument();

    const removeBtn = screen.getByRole("button", { name: /eliminar producto/i });
    expect(removeBtn).toBeInTheDocument();

    // 3. Verificar números tabulares (clase tabular-nums) para precios y totales
    const prices = screen.getAllByText(/\$12.50/);
    expect(prices).toHaveLength(2);
    prices.forEach((priceEl) => {
      expect(priceEl).toHaveClass("tabular-nums");
    });
  });

  it("applies dynamic brand color style to trigger and checkout buttons", async () => {
    useCart.getState().addItem("tenant-123", {
      id: "prod-1",
      name: "Hamburguesa Vegana",
      price: 12.50,
      image_url: "https://example.com/hamb.jpg",
    });

    render(
      <CartDrawer 
        whatsapp="+593999999999" 
        tenantName="Burger Shop" 
        tenantId="tenant-123" 
      />
    );

    const cartButton = screen.getByRole("button", { name: /abrir carrito/i });
    expect(cartButton).toHaveStyle({ backgroundColor: "var(--brand-color)" });

    const user = userEvent.setup();
    await user.click(cartButton);

    const checkoutBtn = screen.getByRole("button", { name: /pedir por whatsapp/i });
    expect(checkoutBtn).toHaveStyle({ backgroundColor: "var(--brand-color)" });
  });
});

