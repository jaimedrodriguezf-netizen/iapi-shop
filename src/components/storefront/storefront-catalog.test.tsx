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

const defaultProps = {
  categories: mockCategories,
  products: mockProducts,
  tenantId: "t1",
  brandColor: "#f97316",
  favoriteIds: [] as string[],
  onToggleFavorite: () => {},
  isAuthenticated: false,
};

describe("StorefrontCatalog", () => {
  it("should render all products when no category filter is active", () => {
    render(
      <StorefrontCatalog {...defaultProps} />
    );

    expect(screen.getByText("Coca-Cola 500ml")).toBeDefined();
    expect(screen.getByText("Papas Fritas")).toBeDefined();
    expect(screen.getByText("Agua Mineral")).toBeDefined();
  });

  it("should filter products by category when a chip is selected", () => {
    render(
      <StorefrontCatalog {...defaultProps} />
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


  it("should show empty state when products array is empty", () => {
    render(
      <StorefrontCatalog
        categories={[]}
        products={[]}
        tenantId="t1"
        brandColor="#f97316"
        favoriteIds={[]}
        onToggleFavorite={() => {}}
        isAuthenticated={false}
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
        brandColor="#f97316"
        favoriteIds={[]}
        onToggleFavorite={() => {}}
        isAuthenticated={false}
      />
    );

    // "Todos" chip should not appear since there's only one visible category
    expect(screen.queryByText("Todos")).toBeNull();
  });

  it("should recursively filter products by subcategory and render cascading rows when parent category is selected", () => {
    const hierarchicalCategories = [
      { id: "cat-1", name: "Ropa", parent_id: null },
      { id: "cat-2", name: "Hombre", parent_id: "cat-1" },
      { id: "cat-3", name: "Camisas", parent_id: "cat-2" },
      { id: "cat-other", name: "Comida", parent_id: null },
    ];

    const hierarchicalProducts = [
      { id: "p1", name: "Ropa General", price: 10, category_id: "cat-1" },
      { id: "p2", name: "Pantalón Hombre", price: 20, category_id: "cat-2" },
      { id: "p3", name: "Camisa Manga Larga", price: 30, category_id: "cat-3" },
      { id: "p4", name: "Hamburguesa", price: 5, category_id: "cat-other" },
    ];

    render(
      <StorefrontCatalog
        categories={hierarchicalCategories}
        products={hierarchicalProducts}
        tenantId="t1"
        brandColor="#f97316"
        favoriteIds={[]}
        onToggleFavorite={() => {}}
        isAuthenticated={false}
      />
    );

    // Initial state: show all products
    expect(screen.getByText("Ropa General")).toBeDefined();
    expect(screen.getByText("Pantalón Hombre")).toBeDefined();
    expect(screen.getByText("Camisa Manga Larga")).toBeDefined();
    expect(screen.getByText("Hamburguesa")).toBeDefined();

    // Click Level 1 "Ropa"
    const l1Chips = screen.getAllByRole("button");
    const ropaChip = l1Chips.find((btn) => btn.textContent === "Ropa");
    expect(ropaChip).toBeDefined();
    fireEvent.click(ropaChip!);

    // Should recursively show all Ropa, Hombre, and Camisas products, but NOT Hamburguesa
    expect(screen.getByText("Ropa General")).toBeDefined();
    expect(screen.getByText("Pantalón Hombre")).toBeDefined();
    expect(screen.getByText("Camisa Manga Larga")).toBeDefined();
    expect(screen.queryByText("Hamburguesa")).toBeNull();

    // Level 2 Subcategory "Hombre" should now be rendered as a chip
    const l2Chips = screen.getAllByRole("button");
    const hombreChip = l2Chips.find((btn) => btn.textContent === "Hombre");
    expect(hombreChip).toBeDefined();
    fireEvent.click(hombreChip!);

    // Should show "Pantalón Hombre" and "Camisa Manga Larga" (Level 3), but NOT "Ropa General" (Level 1) or "Hamburguesa"
    expect(screen.queryByText("Ropa General")).toBeNull();
    expect(screen.getByText("Pantalón Hombre")).toBeDefined();
    expect(screen.getByText("Camisa Manga Larga")).toBeDefined();
    expect(screen.queryByText("Hamburguesa")).toBeNull();

    // Level 3 Category "Camisas" should now be rendered as a chip
    const l3Chips = screen.getAllByRole("button");
    const camisasChip = l3Chips.find((btn) => btn.textContent === "Camisas");
    expect(camisasChip).toBeDefined();
    fireEvent.click(camisasChip!);

    // Should show ONLY "Camisa Manga Larga"
    expect(screen.queryByText("Ropa General")).toBeNull();
    expect(screen.queryByText("Pantalón Hombre")).toBeNull();
    expect(screen.getByText("Camisa Manga Larga")).toBeDefined();
    expect(screen.queryByText("Hamburguesa")).toBeNull();
  });
});