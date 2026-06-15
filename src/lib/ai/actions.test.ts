import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProductDescription } from "./actions";
import { aiRateLimit } from "@/lib/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock corregido de OpenAI
vi.mock("openai", () => {
  const OpenAI = vi.fn();
  OpenAI.prototype.chat = {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Una deliciosa hamburguesa con queso fundido." } }],
      }),
    },
  };
  return { default: OpenAI };
});

vi.mock("@/lib/rate-limit", () => ({
  aiRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 60000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const authenticatedClient = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }) },
};

const unauthenticatedClient = {
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
};

describe("AI Actions: generateProductDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiRateLimit.limit).mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 60000, pending: Promise.resolve() });
    vi.mocked(createClient).mockResolvedValue(authenticatedClient as unknown as SupabaseClient);
  });

  it("should return a generated description based on name and category", async () => {
    const result = await generateProductDescription("Hamburguesa", "Comida");

    expect(result.success).toBe(true);
    expect(result.description).toContain("hamburguesa");
  });

  it("should fail if product name is too short", async () => {
    const result = await generateProductDescription("", "");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should block request when AI rate limit is exceeded", async () => {
    vi.mocked(aiRateLimit.limit).mockResolvedValueOnce({
      success: false, limit: 3, remaining: 0, reset: Date.now() + 60000, pending: Promise.resolve(),
    });
    const result = await generateProductDescription("Hamburguesa", "Comida");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Demasiadas solicitudes de IA");
  });

  it("should allow request when under AI rate limit", async () => {
    vi.mocked(aiRateLimit.limit).mockResolvedValueOnce({
      success: true, limit: 3, remaining: 2, reset: Date.now() + 60000, pending: Promise.resolve(),
    });
    const result = await generateProductDescription("Hamburguesa", "Comida");
    expect(result.success).toBe(true);
  });
});

describe("authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiRateLimit.limit).mockResolvedValue({ success: true, limit: 3, remaining: 2, reset: Date.now() + 60000, pending: Promise.resolve() });
  });

  it("should reject when user is not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValueOnce(unauthenticatedClient as unknown as SupabaseClient);

    const result = await generateProductDescription("Hamburguesa", "Comida");

    expect(result.success).toBe(false);
    expect(result.error).toBe("No autorizado");
  });

  it("should allow when user is authenticated", async () => {
    vi.mocked(createClient).mockResolvedValueOnce(authenticatedClient as unknown as SupabaseClient);

    const result = await generateProductDescription("Hamburguesa", "Comida");

    expect(result.success).toBe(true);
    expect(result.description).toContain("hamburguesa");
  });
});
