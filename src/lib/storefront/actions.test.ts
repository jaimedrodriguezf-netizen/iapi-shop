import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorefrontData } from "./actions";

const mockSingle = vi.fn();
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: mockSingle,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

describe("getStorefrontData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch tenant successfully even if status is draft", async () => {
    const draftTenant = {
      id: "tenant-draft-1",
      name: "Mi Tienda",
      slug: "tienda-draft",
      status: "draft",
    };

    mockSingle.mockResolvedValueOnce({ data: draftTenant, error: null });

    const result = await getStorefrontData("tienda-draft");

    expect(result.success).toBe(true);
    expect(result.tenant).toBeDefined();
    expect(result.tenant?.status).toBe("draft");
  });
});
