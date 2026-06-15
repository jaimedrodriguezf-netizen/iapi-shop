import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260611_orders_rls_hardening.sql", "utf8");

describe("orders RLS hardening migration", () => {
  it("drops the permissive orders_insert_public policy", () => {
    expect(sql).toContain('drop policy if exists "orders_insert_public" on public.orders');
  });

  it("drops the permissive order_items_insert_public policy", () => {
    expect(sql).toContain('drop policy if exists "order_items_insert_public" on public.order_items');
  });

  it("creates orders_insert_public with tenant existence and active status check", () => {
    expect(sql).toContain('create policy "orders_insert_public" on public.orders');
    expect(sql).toContain("public.tenants t");
    expect(sql).toContain("t.status = 'active'");
  });

  it("creates order_items_insert_public with order existence check", () => {
    expect(sql).toContain('create policy "order_items_insert_public" on public.order_items');
    expect(sql).toContain("public.orders o");
    expect(sql).toContain("o.id = order_id");
  });

  it("does NOT use with check (true) anywhere", () => {
    expect(sql).not.toContain("with check (true)");
  });

  it("preserves public (unauthenticated) insert capability for checkout", () => {
    expect(sql).not.toMatch(/orders_insert_public.*to authenticated/);
    expect(sql).not.toMatch(/order_items_insert_public.*to authenticated/);
  });
});
