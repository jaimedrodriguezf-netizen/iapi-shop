import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Home from "./page";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      }),
    }),
  }),
}));

// Mock PromoCarousel (client component)
vi.mock("@/components/landing/promo-carousel", () => ({
  PromoCarousel: () => <div data-testid="promo-carousel">PromoCarousel</div>,
}));

// Mock MarketplaceClient (client component)
vi.mock("@/components/landing/marketplace-client", () => ({
  MarketplaceClient: ({ tenantCount }: { tenantCount: number }) => (
    <div data-testid="marketplace-client">Marketplace ({tenantCount} tenants)</div>
  ),
}));

describe("marketplace landing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the marketplace header and promo carousel", async () => {
    render(await Home());

    expect(screen.getByText("IAPI Shop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /registrarse/i })).toHaveAttribute("href", "/register");
    expect(screen.getByTestId("promo-carousel")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-client")).toBeInTheDocument();
  });

  it("does not show old landing page hero content", async () => {
    render(await Home());

    expect(screen.queryByText(/vende con qr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/crear mi tienda/i)).not.toBeInTheDocument();
  });
});