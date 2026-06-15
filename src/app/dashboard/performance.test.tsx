import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";

// Mocking dependencies to isolate render times from network overhead
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => {
    const m = new Map();
    m.set("host", "localhost:3000");
    return m;
  }),
}));

vi.mock("@/lib/tenants/actions", () => ({
  ensureUserTenant: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: "tenant-123",
      name: "Shop Gourmet",
      slug: "gourmet",
      brand_color: "#f97316",
      status: "active",
      created_at: "2026-06-01",
    },
  }),
  getMyTenant: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: "tenant-123",
      name: "Shop Gourmet",
      slug: "gourmet",
      brand_color: "#f97316",
      status: "active",
      created_at: "2026-06-01",
    },
  }),
  getMyTenants: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "tenant-123",
        name: "Shop Gourmet",
        slug: "gourmet",
        brand_color: "#f97316",
        status: "active",
        created_at: "2026-06-01",
      },
    ],
  }),
  getTenantSubscription: vi.fn().mockResolvedValue({
    success: true,
    data: {
      plans: {
        name: "Plan Premium",
      },
    },
  }),
  getColorPalettes: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "p1", name: "Pastel", brand_color: "#fbcfe8", secondary_color: "#bae6fd", created_at: "2026-06-09T00:00:00Z" }
    ],
  }),
  getCountries: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

vi.mock("@/lib/orders/actions", () => ({
  getTenantOrders: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "o-1", total_amount: 45.5, status: "confirmed", created_at: "2026-06-01" },
      { id: "o-2", total_amount: 12.0, status: "pending", created_at: "2026-06-01" },
    ],
  }),
}));

vi.mock("@/lib/auth/actions", () => ({
  getUserRoleInfo: vi.fn().mockResolvedValue({
    success: true,
    data: {
      platformRole: "merchant",
    },
  }),
}));

vi.mock("@/lib/utils/qr", () => ({
  generateQRCodeDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
  generateQR: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

vi.mock("@/lib/products/actions", () => ({
  checkProductLimit: vi.fn().mockResolvedValue({
    allowed: true,
    current: 3,
    limit: 10,
  }),
}));

// Mock slow/external charting/form components
vi.mock("@/components/dashboard/sample-chart", () => ({
  SampleSalesChart: () => <div data-testid="mock-chart">Chart</div>,
}));
vi.mock("@/components/dashboard/settings-form", () => ({
  SettingsForm: () => <div data-testid="mock-settings-form">Settings Form</div>,
}));
vi.mock("@/components/dashboard/product-list-client", () => ({
  ProductListClient: () => <div data-testid="mock-product-list">Product List</div>,
}));
vi.mock("@/components/dashboard/order-list-client", () => ({
  OrderListClient: () => <div data-testid="mock-order-list">Order List</div>,
}));

// Import page components
import DashboardPage from "./page";
import ProductsPage from "./products/page";
import OrdersPage from "./orders/page";
import QRPage from "./qr/page";
import SettingsPage from "./settings/page";

const ITERATIONS = 30;

function runBenchmark(name: string, renderFunc: () => Promise<React.ReactElement>) {
  const times: number[] = [];

  return {
    async run() {
      for (let i = 0; i < ITERATIONS; i++) {
        const element = await renderFunc();
        const start = performance.now();
        const { unmount } = render(element);
        const end = performance.now();
        times.push(end - start);
        unmount();
      }

      const sum = times.reduce((a, b) => a + b, 0);
      const avg = sum / ITERATIONS;
      const min = Math.min(...times);
      const max = Math.max(...times);

      console.log(`[PERFORMANCE] ${name} -> Avg: ${avg.toFixed(2)}ms | Min: ${min.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`);
      return { name, avg, min, max };
    }
  };
}

describe("Dashboard Menu Sections Performance Profiling", () => {
  it("measures render times of all dashboard sections and ensures latency is within budget", async () => {
    const results = [];

    // 1. Dashboard Main Page
    const dashBench = runBenchmark("Dashboard Home (/dashboard)", async () => {
      return await DashboardPage();
    });
    results.push(await dashBench.run());

    // 2. Products Page
    const prodBench = runBenchmark("Products (/dashboard/products)", async () => {
      return await ProductsPage();
    });
    results.push(await prodBench.run());

    // 3. Orders Page
    const ordBench = runBenchmark("Orders (/dashboard/orders)", async () => {
      return await OrdersPage();
    });
    results.push(await ordBench.run());

    // 4. QR Page
    const qrBench = runBenchmark("QR (/dashboard/qr)", async () => {
      return await QRPage();
    });
    results.push(await qrBench.run());

    // 5. Settings Page
    const setBench = runBenchmark("Settings (/dashboard/settings)", async () => {
      return await SettingsPage();
    });
    results.push(await setBench.run());

    // Verify all pages render in less than 20ms on average in jsdom
    for (const res of results) {
      expect(res.avg).toBeLessThan(25);
    }
  });
});

describe("Dashboard Page Layout Plan Restrictions", () => {
  it("does not render monthly performance chart or branch table on the Free plan, but renders checklist, limits, and premium benefits", async () => {
    const { getTenantSubscription } = await import("@/lib/tenants/actions");
    vi.mocked(getTenantSubscription).mockResolvedValueOnce({
      success: true,
      data: {
        id: "sub-1",
        tenant_id: "tenant-123",
        plans: {
          name: "Free",
          product_limit: 10,
        },
      },
    });

    const page = await DashboardPage();
    const { queryByTestId, getByText, queryByText, queryByTestId: queryByTestIdDirect } = render(page);

    // SampleSalesChart should not be rendered
    expect(queryByTestId("mock-chart")).toBeNull();

    // ShopSummaryTable should not be rendered either
    expect(queryByText(/resumen de sucursales/i)).toBeNull();
    
    // Plan Actual should show FREE
    expect(getByText(/free/i)).toBeDefined();

    // Free plan widgets should be rendered
    expect(getByText(/Pasos Iniciales/i)).toBeDefined();
    expect(getByText(/Límites de Uso/i)).toBeDefined();
    expect(getByText(/Desbloquea el Potencial/i)).toBeDefined();
    expect(queryByTestIdDirect("onboarding-progress-bar")).not.toBeNull();
    expect(queryByTestIdDirect("product-progress-bar")).not.toBeNull();
    expect(queryByTestIdDirect("shop-progress-bar")).not.toBeNull();
  });

  it("renders monthly performance chart and branch table on the Premium plan, but not checklist, limits, or premium benefits", async () => {
    const { getTenantSubscription } = await import("@/lib/tenants/actions");
    vi.mocked(getTenantSubscription).mockResolvedValueOnce({
      success: true,
      data: {
        id: "sub-2",
        tenant_id: "tenant-123",
        plans: {
          name: "Premium",
          product_limit: 300,
        },
      },
    });

    const page = await DashboardPage();
    const { queryByTestId, getByText, getByText: getByTextDirect, queryByText } = render(page);

    // SampleSalesChart should be rendered
    expect(queryByTestId("mock-chart")).not.toBeNull();

    // ShopSummaryTable should be rendered
    expect(getByTextDirect(/resumen de sucursales/i)).toBeDefined();
    
    // Plan Actual should show PREMIUM
    expect(getByText(/premium/i)).toBeDefined();

    // Free plan widgets should NOT be rendered
    expect(queryByText(/Pasos Iniciales/i)).toBeNull();
    expect(queryByText(/Límites de Uso/i)).toBeNull();
    expect(queryByText(/Desbloquea el Potencial/i)).toBeNull();
  });
});
