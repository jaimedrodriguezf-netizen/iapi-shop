import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StorefrontCatalog } from "@/components/storefront/storefront-catalog";

// Mock next/image to avoid SSR issues in tests
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock AddToCartButton to avoid zustand dependency
vi.mock("@/components/storefront/add-to-cart-button", () => ({
  AddToCartButton: ({ product }: { product: { id: string; name: string } }) => (
    <button data-testid={`add-to-cart-${product.id}`}>Add</button>
  ),
}));

const mockCategories = [
  { id: "cat-1", name: "Bebidas" },
  { id: "cat-2", name: "Snacks" },
];

const mockProducts = [
  {
    id: "p1",
    name: "Coca-Cola 500ml",
    price: 1.5,
    category_id: "cat-1",
    description: "Bebida gaseosa",
  },
  {
    id: "p2",
    name: "Papas Fritas",
    price: 2.0,
    category_id: "cat-2",
    description: "Snack crocante",
  },
  {
    id: "p3",
    name: "Agua Mineral",
    price: 0.75,
    category_id: "cat-1",
  },
];

describe("StorefrontCatalog", () => {
  it("should render all products when no category filter is active", () => {
    render(
      <StorefrontCatalog
        categories={mockCategories}
        products={mockProducts}
        tenantId="t1"
        brandColor="#7c3aed"
      />
    );

    expect(screen.getByText("Coca-Cola 500ml")).toBeDefined();
    expect(screen.getByText("Papas Fritas")).toBeDefined();
    expect(screen.getByText("Agua Mineral")).toBeDefined();
  });

  it("should filter products by category when a chip is selected", () => {
    render(
      <StorefrontCatalog
        categories={mockCategories}
        products={mockProducts}
        tenantId="t1"
        brandColor="#7c3aed"
      />
    );

    // Click "Bebidas" filter chip (button element, not the h2 section heading)
    const chips = screen.getAllByRole("button");
    const bebidasChip = chips.find((btn) => btn.textContent === "Bebidas");
    expect(bebidasChip).toBeDefined();
    fireEvent.click(bebidasChip!);

    // Should show Bebidas products only
    expect(screen.getByText("Coca-Cola 500ml")).toBeDefined();
    expect(screen.getByText("Agua Mineral")).toBeDefined();
    // Snacks product should not be visible after filtering
    expect(screen.queryByText("Papas Fritas")).toBeNull();
  });

  it("should show WhatsApp button on product cards when phone is provided", () => {
    render(
      <StorefrontCatalog
        categories={mockCategories}
        products={mockProducts}
        tenantId="t1"
        brandColor="#7c3aed"
        whatsappPhone="+593987654321"
      />
    );

    const whatsappButtons = screen.getAllByRole("link");
    const waLinks = whatsappButtons.filter((el) =>
      (el as HTMLAnchorElement).href?.includes("wa.me")
    );
    expect(waLinks.length).toBeGreaterThan(0);
    expect(waLinks[0].getAttribute("href")).toContain("593987654321");
  });

  it("should not show WhatsApp button when phone is not provided", () => {
    render(
      <StorefrontCatalog
        categories={mockCategories}
        products={mockProducts}
        tenantId="t1"
        brandColor="#7c3aed"
      />
    );

    const waLinks = screen.queryAllByRole("link").filter((el) =>
      (el as HTMLAnchorElement).href?.includes("wa.me")
    );
    expect(waLinks.length).toBe(0);
  });

  it("should show empty state when products array is empty", () => {
    render(
      <StorefrontCatalog
        categories={[]}
        products={[]}
        tenantId="t1"
        brandColor="#7c3aed"
      />
    );

    expect(screen.getByText(/aún no tiene productos disponibles/i)).toBeDefined();
  });

  it("should not show filter chips when there is only one category with products", () => {
    const oneCat = [{ id: "cat-1", name: "Bebidas" }];
    const oneProduct = [
      { id: "p1", name: "Coca-Cola", price: 1.5, category_id: "cat-1" },
    ];

    render(
      <StorefrontCatalog
        categories={oneCat}
        products={oneProduct}
        tenantId="t1"
        brandColor="#7c3aed"
      />
    );

    // "Todos" chip should not appear since there's only one visible category
    expect(screen.queryByText("Todos")).toBeNull();
  });
});