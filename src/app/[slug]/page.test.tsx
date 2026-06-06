/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StorefrontPage from "./page";
import { getStorefrontData } from "@/lib/storefront/actions";

// Mock the getStorefrontData action
vi.mock("@/lib/storefront/actions", () => ({
  getStorefrontData: vi.fn(),
}));

// Mock the subcomponents to keep tests focused on the page logic
vi.mock("@/components/storefront/cart-drawer", () => ({
  CartDrawer: () => <div data-testid="cart-drawer" />
}));
vi.mock("@/components/storefront/storefront-catalog", () => ({
  StorefrontCatalog: () => <div data-testid="storefront-catalog" />
}));

describe("StorefrontPage component tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("injects `--brand-color` on the <main> element", async () => {
    const mockTenant = {
      id: "tenant-1",
      name: "Mi Tienda",
      slug: "mi-tienda",
      brand_color: "#22c55e",
      status: "active",
      address: {
        street: "Calle Principal 123",
        city: "Quito",
        state: "Pichincha",
        zip: "170150",
        country: "Ecuador"
      },
      social_links: {
        instagram: "https://instagram.com/mitienda",
        facebook: "https://facebook.com/mitienda",
        tiktok: "https://tiktok.com/@mitienda"
      }
    };

    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true,
      tenant: mockTenant as any,
      categories: [],
      products: []
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ "--brand-color": "#22c55e" });
  });

  it("renders structured address formatted as a single line in the footer", async () => {
    const mockTenant = {
      id: "tenant-1",
      name: "Mi Tienda",
      slug: "mi-tienda",
      brand_color: "#22c55e",
      status: "active",
      address: {
        street: "Calle Principal 123",
        city: "Quito",
        state: "Pichincha",
        zip: "170150",
        country: "Ecuador"
      },
      social_links: null
    };

    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true,
      tenant: mockTenant as any,
      categories: [],
      products: []
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    // Should find the formatted address
    expect(screen.getByText("Calle Principal 123, Quito, Pichincha, 170150, Ecuador")).toBeInTheDocument();
    // Social section should be hidden (since social_links is null)
    expect(screen.queryByText("Síguenos")).not.toBeInTheDocument();
  });

  it("hides address section when address is null", async () => {
    const mockTenant = {
      id: "tenant-1",
      name: "Mi Tienda",
      slug: "mi-tienda",
      brand_color: null,
      status: "active",
      address: null,
      social_links: {
        instagram: "https://instagram.com/mitienda"
      }
    };

    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true,
      tenant: mockTenant as any,
      categories: [],
      products: []
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    // Visítanos column should not be rendered
    expect(screen.queryByText("Visítanos")).not.toBeInTheDocument();
    // Social links section should be rendered
    expect(screen.getByText("Síguenos")).toBeInTheDocument();
  });

  it("renders 'Tienda en construcción' and does not render normal catalog when tenant status is draft", async () => {
    const mockTenant = {
      id: "tenant-1",
      name: "Mi Tienda",
      slug: "mi-tienda",
      brand_color: "#22c55e",
      status: "draft",
      address: null,
      social_links: null
    };

    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true,
      tenant: mockTenant as any,
      categories: [],
      products: []
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    expect(screen.getByText("Tienda en construcción: Esta tienda está en modo borrador y no es pública aún.")).toBeInTheDocument();
    expect(screen.queryByTestId("storefront-catalog")).not.toBeInTheDocument();
  });
});
