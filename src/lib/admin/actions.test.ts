import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock cookies and navigation
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockGetUserRoleInfo = vi.fn();
vi.mock("@/lib/auth/actions", () => ({
  getUserRoleInfo: vi.fn(() => mockGetUserRoleInfo()),
}));

// Mock Supabase clients
const mockFrom = vi.fn();
const mockListUsers = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
  createAdminClient: vi.fn(async () => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
    from: mockFrom,
  })),
}));

describe("SaaS Admin Actions - getSaaSUsers TDD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for admin check (authorized as admin)
    mockGetUserRoleInfo.mockResolvedValue({
      success: true,
      data: { email: "admin@iapi.shop", platformRole: "admin" },
    });
  });

  it("should return users from profiles and fallback to auth.users if a user is missing from profiles table", async () => {
    // 1. Simular la respuesta de profiles (sin jaimedrodriguezf@gmail.com)
    const mockProfiles = [
      {
        id: "admin-id-123",
        email: "admin@iapi.shop",
        full_name: "Admin User",
        created_at: "2026-06-01T00:00:00Z",
        platform_admins: [{ role: "admin" }],
      },
    ];

    // Simular que en auth.users sí está jaimedrodriguezf@gmail.com
    const mockAuthUsers = [
      {
        id: "admin-id-123",
        email: "admin@iapi.shop",
        user_metadata: { name: "Admin User" },
        created_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "jaime-id-456",
        email: "jaimedrodriguezf@gmail.com",
        user_metadata: { name: "Jaime Rodriguez" },
        created_at: "2026-06-02T00:00:00Z",
      },
    ];

    // Mock supabase.from queries
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockImplementation(() => {
            // Si el query contiene fields de platform_admins, es el select normal
            return {
              order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
            };
          }),
          insert: vi.fn().mockImplementation((payload) => {
            return {
              select: vi.fn().mockImplementation(() => {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: payload.id,
                      email: payload.email,
                      full_name: payload.full_name,
                      created_at: payload.created_at,
                      platform_admins: null
                    },
                    error: null,
                  }),
                };
              }),
            };
          }),
          order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "products") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    // Mock listUsers api call
    mockListUsers.mockResolvedValue({
      data: { users: mockAuthUsers },
      error: null,
    });

    // Import and execute getSaaSUsers
    const { getSaaSUsers } = await import("./actions");
    const result = await getSaaSUsers();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // Debería tener a jaimedrodriguezf@gmail.com en el listado consolidado
    const emails = result.data?.map(u => u.email);
    expect(emails).toContain("jaimedrodriguezf@gmail.com");
    expect(emails).toContain("admin@iapi.shop");

    // Y debería haber intentado autocurar el perfil en profiles (o al menos devolverlo en la respuesta)
    const jaime = result.data?.find(u => u.email === "jaimedrodriguezf@gmail.com");
    expect(jaime?.id).toBe("jaime-id-456");
    expect(jaime?.full_name).toBe("Jaime Rodriguez");
  });
});
