import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("Admin Users Module - Complete User Listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserRoleInfo.mockResolvedValue({
      success: true,
      data: { email: "admin@iapi.shop", platformRole: "admin" },
    });
  });

  it("should return all 3 registered users with correct roles and subscriptions", async () => {
    const mockProfiles = [
      {
        id: "admin-user-id",
        email: "admin@iapi.shop",
        full_name: "Administrador IAPI",
        created_at: "2026-05-15T00:00:00Z",
      },
      {
        id: "jaime-user-id",
        email: "jaimedrodriguezf@gmail.com",
        full_name: "Jaime Rodriguez",
        created_at: "2026-06-01T23:19:31Z",
      },
      {
        id: "vendedor-user-id",
        email: "vendedor@iapi.shop",
        full_name: "Vendedor Tienda",
        created_at: "2026-05-17T01:40:38Z",
      },
    ];

    const mockPlatformAdmins = [
      {
        user_id: "admin-user-id",
        role: "admin",
      },
    ];

    const mockTenantMembers = [
      {
        user_id: "jaime-user-id",
        role: "owner",
        tenant_id: "tenant-evolution-id",
        tenants: {
          id: "tenant-evolution-id",
          name: "evolution",
          slug: "iapi",
          tenant_subscriptions: {
            plans: { name: "Free", code: "free" },
          },
          products: [{ count: 0 }],
        },
      },
      {
        user_id: "vendedor-user-id",
        role: "owner",
        tenant_id: "tenant-tienda-id",
        tenants: {
          id: "tenant-tienda-id",
          name: "tienda",
          slug: "tienda",
          tenant_subscriptions: {
            plans: { name: "Free", code: "free" },
          },
          products: [{ count: 2 }],
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        };
      }
      if (table === "platform_admins") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockPlatformAdmins, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockTenantMembers, error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const { getSaaSUsers } = await import("./actions");
    const result = await getSaaSUsers();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveLength(3);

    const emails = result.data?.map((u) => u.email);
    expect(emails).toContain("admin@iapi.shop");
    expect(emails).toContain("jaimedrodriguezf@gmail.com");
    expect(emails).toContain("vendedor@iapi.shop");

    const adminUser = result.data?.find((u) => u.email === "admin@iapi.shop");
    expect(adminUser?.platformRole).toBe("admin");
    expect(adminUser?.tenants).toHaveLength(0);

    const jaimeUser = result.data?.find((u) => u.email === "jaimedrodriguezf@gmail.com");
    expect(jaimeUser?.platformRole).toBe("merchant");
    expect(jaimeUser?.tenants).toHaveLength(1);
    expect(jaimeUser?.tenants[0].name).toBe("evolution");
    expect(jaimeUser?.tenants[0].slug).toBe("iapi");
    expect(jaimeUser?.tenants[0].planName).toBe("Free");
    expect(jaimeUser?.tenants[0].productCount).toBe(0);

    const vendedorUser = result.data?.find((u) => u.email === "vendedor@iapi.shop");
    expect(vendedorUser?.platformRole).toBe("merchant");
    expect(vendedorUser?.tenants).toHaveLength(1);
    expect(vendedorUser?.tenants[0].name).toBe("tienda");
    expect(vendedorUser?.tenants[0].slug).toBe("tienda");
    expect(vendedorUser?.tenants[0].planName).toBe("Free");
    expect(vendedorUser?.tenants[0].productCount).toBe(2);
  });

  it("should display users in descending order by created_at", async () => {
    const mockProfiles = [
      {
        id: "jaime-user-id",
        email: "jaimedrodriguezf@gmail.com",
        full_name: "Jaime Rodriguez",
        created_at: "2026-06-01T23:19:31Z",
      },
      {
        id: "vendedor-user-id",
        email: "vendedor@iapi.shop",
        full_name: "Vendedor Tienda",
        created_at: "2026-05-17T01:40:38Z",
      },
      {
        id: "admin-user-id",
        email: "admin@iapi.shop",
        full_name: "Administrador IAPI",
        created_at: "2026-05-15T00:00:00Z",
      },
    ];

    const mockPlatformAdmins = [
      {
        user_id: "admin-user-id",
        role: "admin",
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        };
      }
      if (table === "platform_admins") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockPlatformAdmins, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const { getSaaSUsers } = await import("./actions");
    const result = await getSaaSUsers();

    expect(result.success).toBe(true);
    expect(result.data?.[0].email).toBe("jaimedrodriguezf@gmail.com");
    expect(result.data?.[1].email).toBe("vendedor@iapi.shop");
    expect(result.data?.[2].email).toBe("admin@iapi.shop");
  });

  it("should verify all users have complete subscription information", async () => {
    const mockProfiles = [
      {
        id: "jaime-user-id",
        email: "jaimedrodriguezf@gmail.com",
        full_name: null,
        created_at: "2026-06-01T23:19:31Z",
      },
      {
        id: "vendedor-user-id",
        email: "vendedor@iapi.shop",
        full_name: null,
        created_at: "2026-05-17T01:40:38Z",
      },
    ];

    const mockPlatformAdmins: { user_id: string; role: string }[] = [];

    const mockTenantMembers = [
      {
        user_id: "jaime-user-id",
        role: "owner",
        tenant_id: "tenant-evolution-id",
        tenants: {
          id: "tenant-evolution-id",
          name: "evolution",
          slug: "iapi",
          tenant_subscriptions: {
            plans: { name: "Free", code: "free" },
          },
          products: [{ count: 0 }],
        },
      },
      {
        user_id: "vendedor-user-id",
        role: "owner",
        tenant_id: "tenant-tienda-id",
        tenants: {
          id: "tenant-tienda-id",
          name: "tienda",
          slug: "tienda",
          tenant_subscriptions: {
            plans: { name: "Free", code: "free" },
          },
          products: [{ count: 2 }],
        },
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockImplementation(() => ({
            order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          })),
          order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        };
      }
      if (table === "platform_admins") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockPlatformAdmins, error: null }),
        };
      }
      if (table === "tenant_members") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockTenantMembers, error: null }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const { getSaaSUsers } = await import("./actions");
    const result = await getSaaSUsers();

    expect(result.success).toBe(true);

    const jaimeUser = result.data?.find((u) => u.email === "jaimedrodriguezf@gmail.com");
    expect(jaimeUser?.tenants[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      slug: expect.any(String),
      planName: expect.any(String),
      productCount: expect.any(Number),
    });

    const vendedorUser = result.data?.find((u) => u.email === "vendedor@iapi.shop");
    expect(vendedorUser?.tenants[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      slug: expect.any(String),
      planName: expect.any(String),
      productCount: expect.any(Number),
    });
  });
});
