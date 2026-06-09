import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260608000000_categories_subcategories.sql", "utf8");

describe("categories subcategories migration", () => {
  it("adds parent_id column referencing categories table", () => {
    expect(sql).toContain("parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE");
  });

  it("uses IF NOT EXISTS for safe column addition", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS parent_id");
  });

  it("creates index for parent_id", () => {
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id)");
  });

  it("adds comment to parent_id column", () => {
    expect(sql).toContain("COMMENT ON COLUMN public.categories.parent_id IS");
  });
});
