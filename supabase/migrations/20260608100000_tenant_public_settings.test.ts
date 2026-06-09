import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const sqlPath = "supabase/migrations/20260608100000_tenant_public_settings.sql";

describe("tenant public settings migration", () => {
  it("migration sql file exists", () => {
    expect(existsSync(sqlPath)).toBe(true);
  });

  it("adds public_settings column to tenants with default value", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("public_settings jsonb DEFAULT '{\"show_phone\": true, \"show_address\": true, \"show_social_links\": true}'::jsonb");
  });

  it("uses IF NOT EXISTS for safe re-runs", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS");
  });

  it("adds column comment for documentation", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("COMMENT ON COLUMN public.tenants.public_settings");
  });
});
