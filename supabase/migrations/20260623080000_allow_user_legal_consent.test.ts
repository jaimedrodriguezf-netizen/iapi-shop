import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const sqlPath = "supabase/migrations/20260623080000_allow_user_legal_consent.sql";

describe("allow user legal consent migration", () => {
  it("migration sql file exists", () => {
    expect(existsSync(sqlPath)).toBe(true);
  });

  it("creates the RLS update policy for tenant_members", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("CREATE POLICY \"tenant_members_update_own_legal\" ON public.tenant_members");
    expect(sql).toContain("FOR UPDATE TO authenticated");
    expect(sql).toContain("USING (user_id = auth.uid())");
    expect(sql).toContain("WITH CHECK (user_id = auth.uid())");
  });

  it("creates the check trigger function to prevent modifying restricted columns", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.check_tenant_member_self_update()");
    expect(sql).toContain("auth.uid() = NEW.user_id");
    expect(sql).toContain("OLD.role IS DISTINCT FROM NEW.role");
    expect(sql).toContain("OLD.tenant_id IS DISTINCT FROM NEW.tenant_id");
    expect(sql).toContain("OLD.status IS DISTINCT FROM NEW.status");
  });

  it("binds the check trigger to the tenant_members table", () => {
    const sql = existsSync(sqlPath) ? readFileSync(sqlPath, "utf8") : "";
    expect(sql).toContain("CREATE TRIGGER tr_check_tenant_member_self_update");
    expect(sql).toContain("BEFORE UPDATE ON public.tenant_members");
    expect(sql).toContain("FOR EACH ROW EXECUTE FUNCTION public.check_tenant_member_self_update()");
  });
});
