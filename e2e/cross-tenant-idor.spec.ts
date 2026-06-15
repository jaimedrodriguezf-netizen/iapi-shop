import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "";

test.describe("Cross-Tenant IDOR Prevention", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_PASSWORD, "E2E_TEST_PASSWORD not configured");

    // Login as authenticated user
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await Promise.all([
      page.click('button:has-text("Iniciar sesión")'),
      page.waitForURL("**/dashboard**"),
    ]);
  });

  test("should not allow reading products from another tenant via dashboard", async ({ page }) => {
    // Navigate to products page
    await page.goto("/dashboard/products");

    // Attempt to call getProducts with a foreign tenant_id
    // The assertTenantMember guard should reject access
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/products?tenant_id=00000000-0000-0000-0000-000000000000", {
        method: "GET",
      });
      return { status: res.status, ok: res.ok };
    });

    // RLS and tenant membership guard should block access
    expect(result.ok).toBe(false);
  });

  test("should not allow updating products of another tenant", async ({ page }) => {
    await page.goto("/dashboard/products");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/products/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000000",
          tenant_id: "00000000-0000-0000-0000-000000000001",
          name: "Hacked Product",
          price: 0,
        }),
      });
      return { status: res.status, ok: res.ok };
    });

    // Must be rejected — RLS and tenant guard block cross-tenant writes
    expect(result.ok).toBe(false);
  });

  test("should not allow deleting products of another tenant", async ({ page }) => {
    await page.goto("/dashboard/products");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/products/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000000",
          tenant_id: "00000000-0000-0000-0000-000000000001",
        }),
      });
      return { status: res.status, ok: res.ok };
    });

    // Deletion should be rejected
    expect(result.ok).toBe(false);
  });
});