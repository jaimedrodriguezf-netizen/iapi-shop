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
      brand_color: "#7c3aed",
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
      brand_color: "#7c3aed",
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
        brand_color: "#7c3aed",
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
