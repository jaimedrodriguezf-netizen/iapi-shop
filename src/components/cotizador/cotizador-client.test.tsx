import { render, screen, fireEvent } from "@testing-library/react";
import { expect, test, describe, vi } from "vitest";
import { CotizadorClient } from "./cotizador-client";
import type { Product } from "@/lib/products/actions";

const mockProducts: Product[] = [
  {
    id: "p1",
    tenant_id: "t1",
    name: "Camiseta",
    description: "Camiseta de algodón",
    price: 20.0,
    compare_at_price: null,
    stock: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    images: [],
    category_id: null,
    subcategory_id: null
  },
  {
    id: "p2",
    tenant_id: "t1",
    name: "Pantalón",
    description: "Pantalón jean",
    price: 40.0,
    compare_at_price: null,
    stock: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    images: [],
    category_id: null,
    subcategory_id: null
  }
];

describe("CotizadorClient", () => {
  test("renders empty state initially", () => {
    render(<CotizadorClient initialProducts={mockProducts} tenantName="Mi Tienda" />);
    expect(screen.getByText("Aún no has agregado productos a la cotización")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00").length).toBeGreaterThan(0); // Total and subtotal
  });

  test("adds a product and calculates total", async () => {
    render(<CotizadorClient initialProducts={mockProducts} tenantName="Mi Tienda" />);
    
    const addBtn = screen.getByTestId("add-product-p1");
    fireEvent.click(addBtn);

    expect(screen.getAllByText("Camiseta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$20.00").length).toBeGreaterThan(0); // Unit price and total
  });
});
