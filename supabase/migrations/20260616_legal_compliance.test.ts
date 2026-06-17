import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const sqlPath = "supabase/migrations/20260616_legal_compliance.sql";

describe("legal compliance migration", () => {
  it("migration sql file exists", () => {
    expect(existsSync(sqlPath)).toBe(true);
  });

  it("adds legal_version column to site_settings with default '1'", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS legal_version text NOT NULL DEFAULT '1'");
    expect(sql).toContain("public.site_settings.legal_version");
  });

  it("adds legal_accepted_version and legal_accepted_at to tenant_members", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS legal_accepted_version text");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz");
    expect(sql).toContain("public.tenant_members.legal_accepted_version");
    expect(sql).toContain("public.tenant_members.legal_accepted_at");
  });

  it("creates store_reports table with all required columns", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql.toLowerCase()).toContain("create table if not exists public.store_reports");
    expect(sql).toContain("id uuid PRIMARY KEY");
    expect(sql).toContain("tenant_id uuid NOT NULL REFERENCES public.tenants(id)");
    expect(sql).toContain("reporter_email text NOT NULL");
    expect(sql).toContain("reason text NOT NULL");
    expect(sql).toContain("details text NOT NULL CHECK (char_length(details) <= 2000)");
    expect(sql).toContain("status text NOT NULL DEFAULT 'pending'");
    expect(sql).toContain("moderator_notes text");
    expect(sql).toContain("created_at timestamptz NOT NULL DEFAULT now()");
    expect(sql).toContain("updated_at timestamptz NOT NULL DEFAULT now()");
  });

  it("store_reports status check constraint allows valid enum values", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("'pending'");
    expect(sql).toContain("'reviewed'");
    expect(sql).toContain("'actioned'");
    expect(sql).toContain("'dismissed'");
    expect(sql).toMatch(/CHECK \(status IN \(/);
  });

  it("enables RLS on store_reports", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY");
  });

  it("allows anyone to INSERT store reports (anon + authenticated)", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toMatch(/FOR INSERT TO public WITH CHECK \(true\)/);
  });

  it("restricts SELECT on store_reports to platform admins", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toMatch(/FOR SELECT TO authenticated USING \(public\.is_platform_admin\(\)\)/);
  });

  it("restricts UPDATE on store_reports to platform admins", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toMatch(/FOR UPDATE TO authenticated USING \(public\.is_platform_admin\(\)\)/);
  });

  it("uses IF NOT EXISTS / IF NOT EXISTS for idempotent re-runs", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS");
  });

  it("adds auto-update trigger for updated_at", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("store_reports_updated_at");
    expect(sql).toContain("public.set_updated_at()");
  });

  it("indexes tenant_id and status on store_reports", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("idx_store_reports_tenant_id");
    expect(sql).toContain("idx_store_reports_status");
  });
});
