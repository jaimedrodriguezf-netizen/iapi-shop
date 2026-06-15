import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Public Checkout Security", () => {
  test("should reject order with negative total", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        tenant_id: "00000000-0000-0000-0000-000000000000",
        total_amount: -50,
        items: [
          { product_id: "00000000-0000-0000-0000-000000000001", product_name: "Test", unit_price: -50, quantity: 1 },
        ],
      },
    });

    // Zod validation on the server should reject negative amounts
    expect([400, 422, 500]).toContain(response.status());
  });

  test("should reject order with invalid tenant_id format", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        tenant_id: "not-a-uuid",
        total_amount: 100,
        items: [
          { product_id: "00000000-0000-0000-0000-000000000001", product_name: "Test", unit_price: 100, quantity: 1 },
        ],
      },
    });

    expect([400, 422, 500]).toContain(response.status());
  });

  test("should reject order for non-existent tenant", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [
          { product_id: "550e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: 100, quantity: 1 },
        ],
      },
    });

    // Non-existent tenant should fail (4xx or server error from RLS/tenant check)
    expect(response.status()).not.toBe(200);
  });

  test("should reject order with empty items array", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 100,
        items: [],
      },
    });

    expect([400, 422, 500]).toContain(response.status());
  });

  test("should reject order with negative unit_price in items", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/orders`, {
      data: {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        total_amount: 10,
        items: [
          { product_id: "550e8400-e29b-41d4-a716-446655440001", product_name: "Test", unit_price: -5, quantity: 1 },
        ],
      },
    });

    expect([400, 422, 500]).toContain(response.status());
  });
});