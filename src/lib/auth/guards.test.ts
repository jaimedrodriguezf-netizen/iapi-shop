import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertTenantMember } from "./guards";
import type { SupabaseClient } from "@supabase/supabase-js";

// We test against a mock Supabase client
function createMockSupabase(authUser: { id: string } | null, memberExists: boolean) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authUser ? null : { message: "Not authenticated" },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: memberExists ? { id: "member-1" } : null,
            error: null,
          }),
        };
      }
      return {};
    }),
  };
}

describe("assertTenantMember", () => {
  it("should return ok when user is a member of the tenant", async () => {
    const mockSupabase = createMockSupabase({ id: "user-1" }, true);
    const result = await assertTenantMember(mockSupabase as unknown as SupabaseClient, "tenant-1");
    expect(result.ok).toBe(true);
  });

  it("should return error when user is not authenticated", async () => {
    const mockSupabase = createMockSupabase(null, true);
    const result = await assertTenantMember(mockSupabase as unknown as SupabaseClient, "tenant-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("No autorizado");
  });

  it("should return error when user is not a member of the tenant", async () => {
    const mockSupabase = createMockSupabase({ id: "user-1" }, false);
    const result = await assertTenantMember(mockSupabase as unknown as SupabaseClient, "tenant-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("No autorizado");
  });
});