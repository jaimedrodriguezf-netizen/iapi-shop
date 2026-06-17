import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLimitFn = vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 900000 });

vi.mock("@upstash/ratelimit", () => {
  class MockRatelimit {
    limit = mockLimitFn;
    constructor(_opts: unknown) {}
    static slidingWindow = vi.fn();
  }
  return { Ratelimit: MockRatelimit as unknown as typeof import("@upstash/ratelimit").Ratelimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

describe("rate-limit helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set default after clearAllMocks restores mockFn to return undefined
    mockLimitFn.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 900000 });
  });

  it("exports authRateLimit with limit method", async () => {
    const { authRateLimit } = await import("./rate-limit");
    expect(authRateLimit).toBeDefined();
    expect(authRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports orderRateLimit with limit method", async () => {
    const { orderRateLimit } = await import("./rate-limit");
    expect(orderRateLimit).toBeDefined();
    expect(orderRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports aiRateLimit with limit method", async () => {
    const { aiRateLimit } = await import("./rate-limit");
    expect(aiRateLimit).toBeDefined();
    expect(aiRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports uploadRateLimit with limit method", async () => {
    const { uploadRateLimit } = await import("./rate-limit");
    expect(uploadRateLimit).toBeDefined();
    expect(uploadRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports productRateLimit with limit method", async () => {
    const { productRateLimit } = await import("./rate-limit");
    expect(productRateLimit).toBeDefined();
    expect(productRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports categoryRateLimit with limit method", async () => {
    const { categoryRateLimit } = await import("./rate-limit");
    expect(categoryRateLimit).toBeDefined();
    expect(categoryRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports tenantRateLimit with limit method", async () => {
    const { tenantRateLimit } = await import("./rate-limit");
    expect(tenantRateLimit).toBeDefined();
    expect(tenantRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports slugRateLimit with limit method", async () => {
    const { slugRateLimit } = await import("./rate-limit");
    expect(slugRateLimit).toBeDefined();
    expect(slugRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports reportRateLimit with limit method", async () => {
    const { reportRateLimit } = await import("./rate-limit");
    expect(reportRateLimit).toBeDefined();
    expect(reportRateLimit.limit).toBe(mockLimitFn);
  });

  it("exports getClientIdentifier as a function", async () => {
    const { getClientIdentifier } = await import("./rate-limit");
    expect(getClientIdentifier).toBeDefined();
    expect(typeof getClientIdentifier).toBe("function");
  });
});