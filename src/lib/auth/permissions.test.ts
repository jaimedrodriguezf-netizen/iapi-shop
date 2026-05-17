import { describe, expect, it } from "vitest";
import { can, isProtectedAppRoute, type TenantRole } from "./permissions";

describe("tenant role permissions", () => {
  it.each<TenantRole>(["owner", "admin"])(
    "%s can manage tenant settings except subscription-only ownership rules",
    (role) => {
      expect(can(role, "tenant.settings.update")).toBe(true);
      expect(can(role, "products.create")).toBe(true);
      expect(can(role, "orders.update")).toBe(true);
    },
  );

  it("only owner can manage billing and subscription", () => {
    expect(can("owner", "billing.manage")).toBe(true);
    expect(can("admin", "billing.manage")).toBe(false);
    expect(can("sales", "billing.manage")).toBe(false);
  });

  it("inventory can manage products, stock, uploads, and AI images without order updates", () => {
    expect(can("inventory", "products.create")).toBe(true);
    expect(can("inventory", "inventory.update")).toBe(true);
    expect(can("inventory", "media.upload")).toBe(true);
    expect(can("inventory", "ai.images.generate")).toBe(true);
    expect(can("inventory", "orders.update")).toBe(false);
  });

  it("sales can manage orders but cannot generate billable AI usage", () => {
    expect(can("sales", "orders.update")).toBe(true);
    expect(can("sales", "customers.read")).toBe(true);
    expect(can("sales", "ai.images.generate")).toBe(false);
    expect(can("sales", "products.create")).toBe(false);
  });

  it("viewer is read-only", () => {
    expect(can("viewer", "products.read")).toBe(true);
    expect(can("viewer", "orders.read")).toBe(true);
    expect(can("viewer", "products.create")).toBe(false);
    expect(can("viewer", "orders.update")).toBe(false);
  });
});

describe("protected app routes", () => {
  it.each(["/marketplace", "/tienda/demo", "/producto/demo", "/dashboard", "/admin"])(
    "requires authentication for %s",
    (pathname) => {
      expect(isProtectedAppRoute(pathname)).toBe(true);
    },
  );

  it.each(["/", "/login", "/register", "/vendedores"])(
    "allows anonymous access only to public marketing routes: %s",
    (pathname) => {
      expect(isProtectedAppRoute(pathname)).toBe(false);
    },
  );
});
