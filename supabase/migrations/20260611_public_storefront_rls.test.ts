import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260611_public_storefront_rls.sql", "utf8");

describe("20260611_public_storefront_rls", () => {
  // ── Policies that MUST exist ──────────────────────────────────
  const requiredAnonPolicies = [
    { table: "tenants", policy: "tenants_select_public_active" },
    { table: "products", policy: "products_select_public_active" },
    { table: "categories", policy: "categories_select_public_active" },
    { table: "product_images", policy: "product_images_select_public_active" },
    { table: "tenant_subscriptions", policy: "tenant_subscriptions_select_public_active" },
  ];

  it.each(requiredAnonPolicies)(
    "creates anon SELECT policy on $table ($policy)",
    ({ policy }) => {
      expect(sql).toContain(`create policy "${policy}"`);
    }
  );

  it.each(requiredAnonPolicies)(
    "$table policy uses for select to anon",
    ({ policy }) => {
      // Find the block for this specific policy
      const policyIndex = sql.indexOf(`create policy "${policy}"`);
      const policyBlock = sql.slice(policyIndex, policyIndex + 600);

      expect(policyBlock).toContain("for select");
      expect(policyBlock).toContain("to anon");
    }
  );

  // ── Tenants — active only ─────────────────────────────────────
  describe("tenants_select_public_active", () => {
    it("restricts to active tenants", () => {
      const policyIndex = sql.indexOf('create policy "tenants_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 250);
      expect(block).toContain("status = 'active'");
    });

    it("does NOT grant insert to anon", () => {
      expect(sql).not.toContain("for insert to anon");
    });

    it("does NOT grant update to anon on tenants", () => {
      const tenantAnonUpdate = sql.match(/tenants[\s\S]*?for (update|delete|all) to anon/);
      expect(tenantAnonUpdate).toBeNull();
    });
  });

  // ── Products — active + tenant active ─────────────────────────
  describe("products_select_public_active", () => {
    it("restricts to active products", () => {
      const policyIndex = sql.indexOf('create policy "products_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 400);
      expect(block).toContain("is_active = true");
    });

    it("verifies tenant is active", () => {
      const policyIndex = sql.indexOf('create policy "products_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 400);
      expect(block).toContain("t.status = 'active'");
    });
  });

  // ── Categories — tenant active ────────────────────────────────
  describe("categories_select_public_active", () => {
    it("verifies tenant is active", () => {
      const policyIndex = sql.indexOf('create policy "categories_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 400);
      expect(block).toContain("t.status = 'active'");
    });
  });

  // ── Product images — chained through products → tenants ───────
  describe("product_images_select_public_active", () => {
    it("chains through products and tenants", () => {
      const policyIndex = sql.indexOf('create policy "product_images_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 400);
      expect(block).toContain("products p");
      expect(block).toContain("tenants t");
      expect(block).toContain("p.is_active = true");
      expect(block).toContain("t.status = 'active'");
    });
  });

  // ── Tenant subscriptions — active only ────────────────────────
  describe("tenant_subscriptions_select_public_active", () => {
    it("restricts to active subscriptions", () => {
      const policyIndex = sql.indexOf('create policy "tenant_subscriptions_select_public_active"');
      const block = sql.slice(policyIndex, policyIndex + 250);
      expect(block).toContain("status = 'active'");
    });
  });

  // ── Hardening: NO write access for anon ───────────────────────
  describe("no anon write access", () => {
    it("has no insert for anon anywhere", () => {
      expect(sql).not.toContain("for insert to anon");
    });

    it("has no update for anon anywhere", () => {
      expect(sql).not.toContain("for update to anon");
    });

    it("has no delete for anon anywhere", () => {
      expect(sql).not.toContain("for delete to anon");
    });

    it("has no all for anon anywhere", () => {
      expect(sql).not.toContain("for all to anon");
    });
  });

  // ── Existing authenticated policies are untouched ─────────────
  describe("preserves existing authenticated policies", () => {
    it("only adds anon policies (no alteration of existing)", () => {
      // This migration should NOT contain drop policy statements
      expect(sql).not.toContain("drop policy");
    });
  });
});
