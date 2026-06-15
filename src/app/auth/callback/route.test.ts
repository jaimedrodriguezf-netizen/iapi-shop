import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

function buildRequest(url: string): Request {
  return new Request(url, {
    headers: {
      host: "iapi.shop",
      "x-forwarded-proto": "https",
    },
  });
}

describe("OAuth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to a safe next param after successful code exchange", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code&next=/dashboard");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/dashboard");
  });

  it("redirects to /perfil when no next param is provided", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/perfil");
  });

  it("redirects to a custom safe path", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code&next=/onboarding");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/onboarding");
  });

  it("blocks open redirect via protocol-relative URL and falls back to /perfil", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code&next=//evil.com");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/perfil");
    expect(res.headers.get("location")).not.toContain("evil.com");
  });

  it("blocks open redirect via absolute URL and falls back to /perfil", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code&next=https://evil.com");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/perfil");
    expect(res.headers.get("location")).not.toContain("evil.com");
  });

  it("blocks open redirect via javascript: protocol and falls back to /perfil", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=valid-code&next=javascript:alert(1)");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://iapi.shop/perfil");
    expect(res.headers.get("location")).not.toContain("javascript");
  });

  it("redirects to login error page when no code is provided", async () => {
    const req = buildRequest("https://iapi.shop/auth/callback");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=OAuth%20Authentication%20Failed");
  });

  it("redirects to login error page when code exchange fails", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: { message: "Invalid code" } }) },
    } as unknown as SupabaseClient);

    const req = buildRequest("https://iapi.shop/auth/callback?code=bad-code&next=/dashboard");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=OAuth%20Authentication%20Failed");
  });
});
