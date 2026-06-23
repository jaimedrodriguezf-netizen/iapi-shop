import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Chainable thenable mock for Supabase queries
function makeChain(data: unknown = { data: [], error: null, count: 0 }) {
  const chain: Record<string, unknown> = {
    then(resolve: (v: unknown) => void) { resolve(data); },
  };
  return new Proxy(chain, {
    get(target, prop: string) {
      if (prop in target) return (target as Record<string, unknown>)[prop];
      if (prop === 'then') return undefined;
      return vi.fn().mockReturnValue(makeChain(data));
    },
  });
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnValue(makeChain()),
  }),
}));

// vi.mock("@/components/landing/promo-carousel", () => ({
//   PromoCarousel: () => <div data-testid="promo-carousel">PromoCarousel</div>,
// })); // Desactivado — carrusel comentado

vi.mock("@/components/landing/marketplace-page", () => ({
  MarketplacePage: ({ siteName, isAuthenticated }: { siteName: string; isAuthenticated: boolean }) => (
    <div data-testid="marketplace-page">
      <span>{siteName}</span>
      {!isAuthenticated && (
        <>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/login">Iniciar sesión</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/register">Registrarse</a>
        </>
      )}
      {/* <div data-testid="promo-carousel" /> Desactivado — carrusel comentado */}
    </div>
  ),
}));

vi.mock("@/lib/sections/actions", () => ({
  getMarketplaceSections: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock("@/lib/admin/banner-actions", () => ({
  getPromoBanners: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

import Home from "./page";

describe("marketplace landing page", () => {
  it("renders the marketplace page with IAPI Shop name and login links", async () => {
    render(await Home());

    expect(screen.getByText("IAPI Shop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /registrarse/i })).toHaveAttribute("href", "/register");
  });

  it("does not show old landing page hero content", async () => {
    render(await Home());

    expect(screen.queryByText(/vende con qr/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/crear mi tienda/i)).not.toBeInTheDocument();
  });
});
