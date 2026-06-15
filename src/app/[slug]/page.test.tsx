/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import StorefrontPage from "./page";
import { getStorefrontData } from "@/lib/storefront/actions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/storefront/actions", () => ({
  getStorefrontData: vi.fn(),
}));

vi.mock("@/lib/storefront/favorites-actions", () => ({
  getMyFavoriteIds: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/lib/sections/actions", () => ({
  getTenantSections: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/components/storefront/cart-drawer", () => ({
  CartDrawer: () => <div data-testid="cart-drawer" />,
}));

vi.mock("@/components/storefront/storefront-favorites-wrapper", () => ({
  StorefrontFavoritesWrapper: ({ tenantInfo }: any) => (
    <div data-testid="storefront-favorites-wrapper">
      {tenantInfo?.address && <span>Address: {tenantInfo.address}</span>}
    </div>
  ),
}));

function makeTenant(overrides: Record<string, unknown> = {}) {
  return {
    id: "tenant-1", name: "Mi Tienda", slug: "mi-tienda",
    brand_color: "#22c55e", status: "active",
    address: { street: "Calle Principal 123", city: "Quito", state: "Pichincha", zip: "170150", country: "Ecuador" },
    social_links: { instagram: "https://instagram.com/mitienda" },
    ...overrides,
  };
}

describe("StorefrontPage component tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects `--brand-color` on the <main> element", async () => {
    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true, tenant: makeTenant() as any, categories: [], products: [],
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    expect(screen.getByRole("main")).toHaveStyle({ "--brand-color": "#22c55e" });
  });

  it("renders formatted address in the footer", async () => {
    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true, tenant: makeTenant() as any, categories: [], products: [],
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    expect(screen.getByText(/Dirección: Calle Principal 123, Quito, Pichincha, Ecuador/)).toBeInTheDocument();
  });

  it("hides address section when address is null", async () => {
    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true, tenant: makeTenant({ address: null }) as any, categories: [], products: [],
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    expect(screen.queryByText(/Dirección:/i)).not.toBeInTheDocument();
  });

  it("renders 'Tienda en construcción' for draft status", async () => {
    vi.mocked(getStorefrontData).mockResolvedValue({
      success: true, tenant: makeTenant({ status: "draft", address: null, social_links: null }) as any,
      categories: [], products: [],
    });

    const pageElement = await StorefrontPage({ params: Promise.resolve({ slug: "mi-tienda" }) });
    render(pageElement);

    expect(screen.getByText(/Tienda en construcción/i)).toBeInTheDocument();
    expect(screen.queryByTestId("storefront-favorites-wrapper")).not.toBeInTheDocument();
  });
});
