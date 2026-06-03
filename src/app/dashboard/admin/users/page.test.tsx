import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetUserRoleInfo = vi.fn();
const mockGetSaaSUsers = vi.fn();

vi.mock("@/lib/auth/actions", () => ({
  getUserRoleInfo: vi.fn(() => mockGetUserRoleInfo()),
}));

vi.mock("@/lib/admin/actions", () => ({
  getSaaSUsers: vi.fn(() => mockGetSaaSUsers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/components/dashboard/admin-users-client", () => ({
  AdminUsersClient: vi.fn(() => <div data-testid="admin-users-client" />),
}));

describe("AdminUsersPage Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to /dashboard if user is not authorized", async () => {
    mockGetUserRoleInfo.mockResolvedValueOnce({
      success: false,
      error: "No autenticado",
    });

    const { default: AdminUsersPage } = await import("./page");

    await expect(AdminUsersPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mockGetSaaSUsers).not.toHaveBeenCalled();
  });

  it("should redirect to /dashboard if user is not an admin", async () => {
    mockGetUserRoleInfo.mockResolvedValueOnce({
      success: true,
      data: { email: "user@gmail.com", platformRole: "merchant" },
    });

    const { default: AdminUsersPage } = await import("./page");

    await expect(AdminUsersPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(mockGetSaaSUsers).not.toHaveBeenCalled();
  });

  it("should render control panel UI if user is platform admin", async () => {
    mockGetUserRoleInfo.mockResolvedValueOnce({
      success: true,
      data: { email: "admin@iapi.shop", platformRole: "admin" },
    });

    mockGetSaaSUsers.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: "user-1",
          email: "jaime@gmail.com",
          full_name: "Jaime",
          platformRole: "merchant",
          tenants: [],
          created_at: "2026-06-02T00:00:00Z",
        },
      ],
    });

    const { default: AdminUsersPage } = await import("./page");
    const node = await AdminUsersPage();

    expect(node).toBeDefined();
    expect(mockGetSaaSUsers).toHaveBeenCalled();
  });
});
