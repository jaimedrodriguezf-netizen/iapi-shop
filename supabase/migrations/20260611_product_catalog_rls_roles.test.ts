import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260611_product_catalog_rls_roles.sql", "utf8");

describe("product catalog RLS role restriction migration", () => {
  it("drops old permissive insert policies on categories, tags, and products", () => {
    expect(sql).toContain('drop policy if exists "categories_insert_member"');
    expect(sql).toContain('drop policy if exists "tags_insert_member"');
    expect(sql).toContain('drop policy if exists "products_insert_member"');
  });

  it("drops old permissive update policies on categories, tags, and products", () => {
    expect(sql).toContain('drop policy if exists "categories_update_member"');
    expect(sql).toContain('drop policy if exists "tags_update_member"');
    expect(sql).toContain('drop policy if exists "products_update_member"');
  });

  it("drops old permissive delete policies on categories, tags, and products", () => {
    expect(sql).toContain('drop policy if exists "categories_delete_member"');
    expect(sql).toContain('drop policy if exists "tags_delete_member"');
    expect(sql).toContain('drop policy if exists "products_delete_member"');
  });

  it("restricts categories insert to owner, admin, inventory roles", () => {
    expect(sql).toContain('create policy "categories_insert_editor" on public.categories');
    expect(sql).toContain("array['owner','admin','inventory']::public.tenant_role[]");
  });

  it("restricts tags insert to editor roles", () => {
    expect(sql).toContain('create policy "tags_insert_editor" on public.tags');
  });

  it("restricts products insert to editor roles", () => {
    expect(sql).toContain('create policy "products_insert_editor" on public.products');
  });

  it("restricts categories delete to owner and admin only", () => {
    expect(sql).toContain('create policy "categories_delete_admin" on public.categories');
    expect(sql).toContain("array['owner','admin']");
  });

  it("restricts tags delete to owner and admin only", () => {
    expect(sql).toContain('create policy "tags_delete_admin" on public.tags');
  });

  it("restricts products delete to owner and admin only", () => {
    expect(sql).toContain('create policy "products_delete_admin" on public.products');
  });

  it("restricts product_images insert to editor roles", () => {
    expect(sql).toContain('create policy "product_images_insert_editor"');
    expect(sql).toContain("array['owner','admin','inventory']::public.tenant_role[]");
  });

  it("restricts product_images delete to admin roles", () => {
    expect(sql).toContain('create policy "product_images_delete_admin"');
    expect(sql).toContain("array['owner','admin']::public.tenant_role[]");
  });

  it("restricts product_tags insert to editor roles", () => {
    expect(sql).toContain('create policy "product_tags_insert_editor"');
  });

  it("restricts product_tags delete to admin roles", () => {
    expect(sql).toContain('create policy "product_tags_delete_admin"');
  });

  it("preserves select access for all tenant members", () => {
    expect(sql).not.toContain('drop policy if exists "categories_select_member"');
    expect(sql).not.toContain('drop policy if exists "tags_select_member"');
    expect(sql).not.toContain('drop policy if exists "products_select_member"');
    expect(sql).not.toContain('drop policy if exists "product_images_select_member"');
    expect(sql).not.toContain('drop policy if exists "product_tags_select_member"');
  });
});
