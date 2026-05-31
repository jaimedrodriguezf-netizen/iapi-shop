import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260531205500_orders_analytics.sql", "utf8");

describe("orders & analytics migration", () => {
  it("creates order_status enum", () => {
    expect(sql).toContain("create type public.order_status as enum");
  });

  it("creates orders table", () => {
    expect(sql).toContain("create table if not exists public.orders");
  });

  it("creates order_items table", () => {
    expect(sql).toContain("create table if not exists public.order_items");
  });

  it("enables RLS on tables", () => {
    expect(sql).toContain("alter table public.orders enable row level security;");
    expect(sql).toContain("alter table public.order_items enable row level security;");
  });

  it("defines RLS policies for orders and order items", () => {
    expect(sql).toContain('create policy "orders_insert_public" on public.orders');
    expect(sql).toContain('create policy "orders_select_member" on public.orders');
    expect(sql).toContain('create policy "orders_update_member" on public.orders');
    expect(sql).toContain('create policy "order_items_insert_public" on public.order_items');
    expect(sql).toContain('create policy "order_items_select_member" on public.order_items');
  });

  it("creates indexes on tenant_id and order_id", () => {
    expect(sql).toContain("idx_orders_tenant_id");
    expect(sql).toContain("idx_order_items_order_id");
  });
});
