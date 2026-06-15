import { describe, expect, it } from "vitest";
import { isSafeRedirect } from "./url-utils";

describe("isSafeRedirect", () => {
  describe("valid safe redirects", () => {
    it("accepts a simple path", () => {
      expect(isSafeRedirect("/dashboard")).toBe(true);
    });

    it("accepts a path with sub-route", () => {
      expect(isSafeRedirect("/dashboard/settings")).toBe(true);
    });

    it("accepts root path", () => {
      expect(isSafeRedirect("/")).toBe(true);
    });

    it("accepts path with query params", () => {
      expect(isSafeRedirect("/onboarding?step=2")).toBe(true);
    });

    it("accepts path with fragment", () => {
      expect(isSafeRedirect("/dashboard#section")).toBe(true);
    });
  });

  describe("rejects unsafe redirects", () => {
    it("rejects protocol-relative URL", () => {
      expect(isSafeRedirect("//evil.com")).toBe(false);
    });

    it("rejects protocol-relative URL with path", () => {
      expect(isSafeRedirect("//evil.com/path")).toBe(false);
    });

    it("rejects absolute HTTPS URL", () => {
      expect(isSafeRedirect("https://evil.com")).toBe(false);
    });

    it("rejects absolute HTTP URL", () => {
      expect(isSafeRedirect("http://evil.com")).toBe(false);
    });

    it("rejects backslash variant", () => {
      expect(isSafeRedirect("/\\evil.com")).toBe(false);
    });

    it("rejects javascript: protocol", () => {
      expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
    });

    it("rejects javascript: protocol with uppercase", () => {
      expect(isSafeRedirect("JAVASCRIPT:alert(1)")).toBe(false);
    });

    it("rejects data: protocol", () => {
      expect(isSafeRedirect("data:text/html,<h1>hack</h1>")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isSafeRedirect("")).toBe(false);
    });

    it("rejects URL without leading slash", () => {
      expect(isSafeRedirect("evil.com")).toBe(false);
    });

    it("rejects FTP protocol", () => {
      expect(isSafeRedirect("ftp://evil.com")).toBe(false);
    });
  });
});
