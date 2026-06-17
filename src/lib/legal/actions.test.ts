import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
    expect(result.error).toBe("No autorizado");
  });

  it("returns error when auth fails", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const { acceptLegalTerms } = await import("./actions");
    const result = await acceptLegalTerms();

    expect(result.success).toBe(false);
    expect(result.error).toBe("No autorizado");
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
    expect(result.error).toContain("Error al aceptar");
  });
});