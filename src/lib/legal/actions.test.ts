import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ActionResult } from "./actions";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock rate limiter
const mockReportLimit = vi.fn().mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 900000 });
vi.mock("@/lib/rate-limit", () => ({
  reportRateLimit: { limit: mockReportLimit },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockFrom = vi.fn();

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: mockFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("acceptLegalTerms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toBe("No autorizado");
  });

  it("returns error when auth fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toBe("No autorizado");
  });

  it("updates tenant_members with legal version when authenticated", async () => {
    const userId = "user-123";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // Mock chain: from("site_settings").select("legal_version").single() → "2"
    // Mock chain: from("tenant_members").update({...}).eq("user_id", userId) → success
    const updateMock = vi.fn().mockReturnThis();
    const eqUserMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "2" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          update: updateMock,
          eq: vi.fn().mockReturnValue({ eq: eqUserMock }),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      }
      return mockSupabase;
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("2");
    }
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        legal_accepted_version: "2",
        legal_accepted_at: expect.any(String),
      }),
    );
  });

  it("defaults to version '1' when site_settings has no legal_version", async () => {
    const userId = "user-456";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const eqUserMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          update: updateMock,
          eq: vi.fn().mockReturnValue({ eq: eqUserMock }),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      }
      return mockSupabase;
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("1");
    }
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        legal_accepted_version: "1",
        legal_accepted_at: expect.any(String),
      }),
    );
  });

  it("sets legal_accepted_at to a valid ISO timestamp", async () => {
    const userId = "user-789";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const eqUserMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "1" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          update: updateMock,
          eq: vi.fn().mockReturnValue({ eq: eqUserMock }),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      }
      return mockSupabase;
    });

    const beforeCall = new Date().toISOString();

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    const afterCall = new Date().toISOString();

    expect(result.success).toBe(true);

    // Verify the timestamp passed to update is a valid ISO string
    const updateCall = updateMock.mock.calls[0];
    const acceptedAt = updateCall[0].legal_accepted_at;

    // Should be a valid date string between beforeCall and afterCall
    const acceptedDate = new Date(acceptedAt);
    expect(acceptedDate.getTime()).toBeGreaterThanOrEqual(new Date(beforeCall).getTime() - 1000);
    expect(acceptedDate.getTime()).toBeLessThanOrEqual(new Date(afterCall).getTime() + 1000);
  });

  it("is idempotent — calling twice does not error", async () => {
    const userId = "user-idempotent";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    const eqUserMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "2" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          update: updateMock,
          eq: vi.fn().mockReturnValue({ eq: eqUserMock }),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(),
        };
      }
      return mockSupabase;
    });

    const { acceptLegalTerms } = await import("./actions");

    const result1 = await acceptLegalTerms();
    const result2 = await acceptLegalTerms();

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    // Both calls update the same tenant_members row
    expect(updateMock).toHaveBeenCalledTimes(2);
  });

  it("returns error when database update fails", async () => {
    const userId = "user-db-error";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const updateMock = vi.fn().mockReturnThis();
    // Simulate Supabase returning an error from the update query
    const eqMock = vi.fn().mockResolvedValue({ error: { message: "DB error" } });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "1" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          update: updateMock,
          eq: eqMock,
        };
      }
      return mockSupabase;
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(false);
    expect((result as { error: string }).error).toContain("Error al aceptar");
  });
});

describe("checkReConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns needsReAccept=false for admin users", async () => {
    const { checkReConsent } = await import("./actions");
    const result = await checkReConsent(true);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.needsReAccept).toBe(false);
  });

  it("returns needsReAccept=false when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { checkReConsent } = await import("./actions");
    const result = await checkReConsent(false);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.needsReAccept).toBe(false);
  });

  it("returns needsReAccept=true when versions differ", async () => {
    const userId = "user-mismatch";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "2" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_accepted_version: "1" }, error: null }),
        };
      }
      return mockSupabase;
    });

    const { checkReConsent } = await import("./actions");
    const result = await checkReConsent(false);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needsReAccept).toBe(true);
      expect(result.data.currentVersion).toBe("2");
    }
  });

  it("returns needsReAccept=false when versions match", async () => {
    const userId = "user-match";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "1" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_accepted_version: "1" }, error: null }),
        };
      }
      return mockSupabase;
    });

    const { checkReConsent } = await import("./actions");
    const result = await checkReConsent(false);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.needsReAccept).toBe(false);
  });

  it("returns needsReAccept=true when user has not accepted any version", async () => {
    const userId = "user-no-version";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "site_settings") {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_version: "2" }, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { legal_accepted_version: null }, error: null }),
        };
      }
      return mockSupabase;
    });

    const { checkReConsent } = await import("./actions");
    const result = await checkReConsent(false);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needsReAccept).toBe(true);
      expect(result.data.currentVersion).toBe("2");
    }
  });
});

// ─── Task 6.1 / 6.4 / 6.6: submitStoreReport, getPendingReports, updateReportStatus ───

describe("submitStoreReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReportLimit.mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 900000 });
  });

  it("successfully inserts a store report", async () => {
    const tenantId = "550e8400-e29b-41d4-a716-446655440000";
    const reportId = "660e8400-e29b-41d4-a716-446655440001";

    // Mock: from("tenants").select().eq().single() → tenant exists
    // Mock: from("store_reports").insert().select().single() → returns report
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: tenantId }, error: null }),
        };
      }
      if (table === "store_reports") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: reportId, tenant_id: tenantId, status: "pending" },
            error: null,
          }),
        };
      }
      return mockSupabase;
    });

    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: tenantId,
      reporter_email: "reporter@example.com",
      reason: "Productos ilegales",
      details: "This store sells prohibited products.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(reportId);
    }
  });

  it("strips HTML tags from details before storage", async () => {
    const tenantId = "550e8400-e29b-41d4-a716-446655440010";
    const reportId = "660e8400-e29b-41d4-a716-446655440011";

    let insertedData: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: tenantId }, error: null }),
        };
      }
      if (table === "store_reports") {
        return {
          insert: vi.fn((data: Record<string, unknown>) => {
            insertedData = data;
            return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: reportId }, error: null }) };
          }),
        };
      }
      return mockSupabase;
    });

    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: tenantId,
      reporter_email: "reporter@example.com",
      reason: "Contenido inapropiado",
      details: "<script>alert('xss')</script><p>Hello</p> plain text",
    });

    expect(result.success).toBe(true);
    expect(insertedData).not.toBeNull();
    expect((insertedData as unknown as Record<string, unknown>).details).not.toContain("<");
    expect((insertedData as unknown as Record<string, unknown>).details).not.toContain(">");
  });

  it("rejects details exceeding 2000 characters", async () => {
    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: "550e8400-e29b-41d4-a716-446655440020",
      reporter_email: "reporter@example.com",
      reason: "Otro",
      details: "x".repeat(2001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("2000");
    }
  });

  it("rejects invalid email format", async () => {
    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: "550e8400-e29b-41d4-a716-446655440030",
      reporter_email: "not-an-email",
      reason: "Estafa/fraude",
      details: "Test details",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod error message for invalid email contains "electrónico"
      expect(result.error.toLowerCase()).toContain("electr");
    }
  });

  it("rejects invalid reason enum value", async () => {
    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: "550e8400-e29b-41d4-a716-446655440040",
      reporter_email: "valid@example.com",
      reason: "Invalid Reason" as never,
      details: "Test details",
    });

    expect(result.success).toBe(false);
  });

  it("returns error for non-existent tenant", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } }),
        };
      }
      return mockSupabase;
    });

    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: "550e8400-e29b-41d4-a716-446655440050",
      reporter_email: "reporter@example.com",
      reason: "Estafa/fraude",
      details: "This is a scam",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      // Error message contains "encontrada" or "encontr"
      expect(result.error.toLowerCase()).toContain("encontr");
    }
  });

  it("returns error when rate limit exceeded", async () => {
    mockReportLimit.mockResolvedValue({ success: false, limit: 3, remaining: 0, reset: Date.now() + 900000 });

    const { submitStoreReport } = await import("./actions");
    const result = await submitStoreReport({
      tenant_id: "tenant-rate",
      reporter_email: "reporter@example.com",
      reason: "Productos ilegales",
      details: "Rate limited attempt",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("intentos");
    }
  });
});

describe("getPendingReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for non-admin users", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "regular-user" } },
      error: null,
    });

    // Mock: from("tenant_members").select("role").eq().limit(1) → role=owner (not admin)
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ role: "owner" }], error: null }),
        };
      }
      return mockSupabase;
    });

    const { getPendingReports } = await import("./actions");
    const result = await getPendingReports();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("admin");
    }
  });

  it("returns pending reports for admin users", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-user" } },
      error: null,
    });

    const mockReports = [
      { id: "r1", tenant_id: "t1", reporter_email: "a@b.com", reason: "Estafa/fraude", details: "Scam store", status: "pending", moderator_notes: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "r2", tenant_id: "t2", reporter_email: "c@d.com", reason: "Productos ilegales", details: "Illegal items", status: "pending", moderator_notes: null, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ role: "platform_admin" }], error: null }),
        };
      }
      if (table === "store_reports") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockReports, error: null }),
        };
      }
      return mockSupabase;
    });

    const { getPendingReports } = await import("./actions");
    const result = await getPendingReports();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe("r1");
      expect(result.data[1].id).toBe("r2");
    }
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { getPendingReports } = await import("./actions");
    const result = await getPendingReports();

    expect(result.success).toBe(false);
  });
});

describe("updateReportStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates report status as admin", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-user" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ role: "platform_admin" }], error: null }),
        };
      }
      if (table === "store_reports") {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockSupabase;
    });

    const { updateReportStatus } = await import("./actions");
    const result = await updateReportStatus("report-1", "actioned", "Investigated and confirmed");

    expect(result.success).toBe(true);
  });

  it("rejects invalid status enum value", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-user" } },
      error: null,
    });

    const { updateReportStatus } = await import("./actions");
    const result = await updateReportStatus("report-1", "invalid_status" as never);

    expect(result.success).toBe(false);
  });

  it("rejects non-admin users", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "regular-user" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ role: "owner" }], error: null }),
        };
      }
      return mockSupabase;
    });

    const { updateReportStatus } = await import("./actions");
    const result = await updateReportStatus("report-1", "reviewed");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("admin");
    }
  });

  it("persists moderator_notes correctly", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-user" } },
      error: null,
    });

    let updatedData: Record<string, unknown> | null = null;
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ role: "platform_admin" }], error: null }),
        };
      }
      if (table === "store_reports") {
        return {
          update: vi.fn((data: Record<string, unknown>) => {
            updatedData = data;
            return { eq: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      return mockSupabase;
    });

    const { updateReportStatus } = await import("./actions");
    const result = await updateReportStatus("report-2", "dismissed", "False alarm — not a real report");

    expect(result.success).toBe(true);
    expect(updatedData).not.toBeNull();
    expect((updatedData as unknown as Record<string, unknown>).moderator_notes).toBe("False alarm — not a real report");
    expect((updatedData as unknown as Record<string, unknown>).status).toBe("dismissed");
  });

  it("returns error when user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { updateReportStatus } = await import("./actions");
    const result = await updateReportStatus("report-1", "reviewed");

    expect(result.success).toBe(false);
  });
});