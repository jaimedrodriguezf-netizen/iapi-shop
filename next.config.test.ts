import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const config = readFileSync("next.config.ts", "utf8");

describe("next.config.ts security headers", () => {
  it("disables powered-by header", () => {
    expect(config).toContain("poweredByHeader: false");
  });

  it("sets X-Frame-Options to DENY", () => {
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("DENY");
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    expect(config).toContain("X-Content-Type-Options");
    expect(config).toContain("nosniff");
  });

  it("sets Referrer-Policy", () => {
    expect(config).toContain("Referrer-Policy");
    expect(config).toContain("strict-origin-when-cross-origin");
  });

  it("sets Permissions-Policy restricting camera, microphone, geolocation", () => {
    expect(config).toContain("Permissions-Policy");
    expect(config).toContain("camera=()");
    expect(config).toContain("microphone=()");
    expect(config).toContain("geolocation=()");
  });

  it("configures headers via async function", () => {
    expect(config).toContain("async headers()");
  });

  it("sets Strict-Transport-Security", () => {
    expect(config).toContain("Strict-Transport-Security");
    expect(config).toContain("max-age=63072000");
    expect(config).toContain("includeSubDomains");
  });

  it("sets Content-Security-Policy in production", () => {
    expect(config).toContain("Content-Security-Policy");
    expect(config).toContain("default-src 'self'");
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("object-src 'none'");
  });

  it("uses environment-aware CSP (dev vs production)", () => {
    expect(config).toContain("process.env.NODE_ENV === \"development\"");
    // dev CSP is relaxed
    expect(config).toContain("ws:");
    expect(config).toContain("frame-ancestors *");
  });
});
