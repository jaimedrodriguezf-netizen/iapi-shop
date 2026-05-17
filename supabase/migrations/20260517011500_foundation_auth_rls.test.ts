import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20260517011500_foundation_auth_rls.sql", "utf8");

const tables = [
  "profiles",
  "platform_admins",
  "tenants",
  "tenant_members",
  "plans",
  "tenant_subscriptions",
  "subscription_payments",
  "audit_logs",
];

describe("foundation auth RLS migration", () => {
  it.each(tables)("creates %s table", (table) => {
    expect(sql).toMatch(new RegExp(`create table if not exists public\\.${table}`));
  });

  it.each(tables)("enables RLS for %s", (table) => {
    expect(sql).toContain(`alter table public.${table} enable row level security;`);
  });

  it("denies anonymous product/tenant data by not granting anon table access", () => {
    expect(sql.toLowerCase()).not.toContain("grant select on");
    expect(sql.toLowerCase()).not.toContain(" to anon");
  });

  it("bootstraps admin@iapi.shop as a platform admin", () => {
    expect(sql).toContain("admin@iapi.shop");
    expect(sql).toContain("platform_admins");
    expect(sql).toContain("admin");
  });

  it("defines tenant role checks and platform admin helper functions", () => {
    expect(sql).toContain("public.is_platform_admin");
    expect(sql).toContain("public.has_tenant_role");
    expect(sql).toContain("public.current_user_tenant_ids");
  });
});
