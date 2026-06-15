import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the updateSession helper before importing proxy
const mockUpdateSession = vi.fn();
vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: mockUpdateSession,
}));

// Dynamic import to pick up the mock
const proxyModule = await import("@/proxy");

describe("proxy (Next.js 16 middleware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("config.matcher", () => {
    it("excludes _next/static paths", () => {
      expect(proxyModule.config.matcher[0]).toContain("_next/static");
    });

    it("excludes _next/image paths", () => {
      expect(proxyModule.config.matcher[0]).toContain("_next/image");
    });

    it("excludes favicon.ico", () => {
      expect(proxyModule.config.matcher[0]).toContain("favicon.ico");
    });

    it("excludes static assets (svg, png, jpg, jpeg, gif, webp)", () => {
      expect(proxyModule.config.matcher[0]).toContain("svg|png|jpg|jpeg|gif|webp");
    });
  });

  describe("default export", () => {
    it("delegates to updateSession with the incoming request", async () => {
      const request = new NextRequest("https://iapi.shop/dashboard", {});

      mockUpdateSession.mockResolvedValueOnce(new Response());

      await proxyModule.default(request);

      expect(mockUpdateSession).toHaveBeenCalledTimes(1);
      expect(mockUpdateSession).toHaveBeenCalledWith(request);
    });

    it("delegates to updateSession for auth callback routes", async () => {
      const request = new NextRequest("https://iapi.shop/auth/callback", {});

      mockUpdateSession.mockResolvedValueOnce(new Response());

      await proxyModule.default(request);

      expect(mockUpdateSession).toHaveBeenCalledWith(request);
    });
  });
});
