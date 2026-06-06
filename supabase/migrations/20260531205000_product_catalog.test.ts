import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260531205000_product_catalog.sql", "utf8");

describe("product catalog migration", () => {
  it("creates categories table", () => {
    expect(sql).toContain("create table if not exists public.categories");
  });

  it("creates tags table", () => {
    expect(sql).toContain("create table if not exists public.tags");
  });

  it("creates products table", () => {
    expect(sql).toContain("create table if not exists public.products");
  });

  it("creates product_images table", () => {
    expect(sql).toContain("create table if not exists public.product_images");
  });

  it("creates product_tags join table", () => {
    expect(sql).toContain("create table if not exists public.product_tags");
  });

  it("products table references categories with ON DELETE SET NULL", () => {
    expect(sql).toContain("category_id uuid references public.categories(id) on delete set null");
  });

  it("product_images cascades on product delete", () => {
    expect(sql).toMatch(/product_id uuid not null references public\.products\(id\) on delete cascade/);
  });

  it("product_tags cascades on product and tag delete", () => {
    expect(sql).toContain("product_id uuid not null references public.products(id) on delete cascade");
    expect(sql).toContain("tag_id uuid not null references public.tags(id) on delete cascade");
  });

  it("products has tenant_id referencing tenants", () => {
    expect(sql).toContain("tenant_id uuid not null references public.tenants(id) on delete cascade");
  });

  it("enables RLS on all five tables", () => {
    expect(sql).toContain("alter table public.categories enable row level security;");
    expect(sql).toContain("alter table public.tags enable row level security;");
    expect(sql).toContain("alter table public.products enable row level security;");
    expect(sql).toContain("alter table public.product_images enable row level security;");
    expect(sql).toContain("alter table public.product_tags enable row level security;");
  });

  it("defines RLS policies for categories (select, insert, update, delete)", () => {
    expect(sql).toContain('create policy "categories_select_member" on public.categories');
    expect(sql).toContain('create policy "categories_insert_member" on public.categories');
    expect(sql).toContain('create policy "categories_update_member" on public.categories');
    expect(sql).toContain('create policy "categories_delete_member" on public.categories');
  });

  it("defines RLS policies for products (select, insert, update, delete)", () => {
    expect(sql).toContain('create policy "products_select_member" on public.products');
    expect(sql).toContain('create policy "products_insert_member" on public.products');
    expect(sql).toContain('create policy "products_update_member" on public.products');
    expect(sql).toContain('create policy "products_delete_member" on public.products');
  });

  it("product_images and product_tags use exists-based RLS referencing products tenant_id", () => {
    expect(sql).toContain('create policy "product_images_select_member" on public.product_images');
    expect(sql).toContain('create policy "product_tags_select_member" on public.product_tags');
    expect(sql).toContain("public.has_tenant_role(p.tenant_id)");
  });

  it("creates indexes on tenant_id and foreign keys", () => {
    expect(sql).toContain("idx_categories_tenant_id");
    expect(sql).toContain("idx_tags_tenant_id");
    expect(sql).toContain("idx_products_tenant_id");
    expect(sql).toContain("idx_product_images_product_id");
    expect(sql).toContain("idx_product_tags_product_id");
  });

  it("creates updated_at trigger for products", () => {
    expect(sql).toContain("set_products_updated_at before update on public.products");
  });

  it("uses has_tenant_role for RLS policies matching existing conventions", () => {
    expect(sql).toContain("public.has_tenant_role(tenant_id)");
  });
});