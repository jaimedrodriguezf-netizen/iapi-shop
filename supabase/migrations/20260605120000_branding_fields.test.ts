import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260605120000_branding_fields.sql", "utf8");

describe("branding fields migration", () => {
  it("adds brand_color column to tenants", () => {
    expect(sql).toContain("brand_color text DEFAULT NULL");
  });

  it("adds secondary_color column to tenants", () => {
    expect(sql).toContain("secondary_color text DEFAULT NULL");
  });

  it("adds address column as JSONB", () => {
    expect(sql).toContain("address jsonb DEFAULT NULL");
  });

  it("adds social_links column as JSONB", () => {
    expect(sql).toContain("social_links jsonb DEFAULT NULL");
  });

  it("uses IF NOT EXISTS for safe re-runs", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS");
  });

  it("all four branding columns are nullable", () => {
    expect(sql).toContain("brand_color text DEFAULT NULL");
    expect(sql).toContain("secondary_color text DEFAULT NULL");
    expect(sql).toContain("address jsonb DEFAULT NULL");
    expect(sql).toContain("social_links jsonb DEFAULT NULL");
  });

  it("adds column comments for documentation", () => {
    expect(sql).toContain("COMMENT ON COLUMN public.tenants.brand_color");
    expect(sql).toContain("COMMENT ON COLUMN public.tenants.secondary_color");
    expect(sql).toContain("COMMENT ON COLUMN public.tenants.address");
    expect(sql).toContain("COMMENT ON COLUMN public.tenants.social_links");
  });
});