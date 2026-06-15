import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const spec = readFileSync("e2e/onboarding.spec.ts", "utf8");

describe("e2e/onboarding.spec.ts security", () => {
  it("does not contain hardcoded password danro32676", () => {
    expect(spec).not.toContain("'danro32676'");
    expect(spec).not.toContain('"danro32676"');
  });

  it("does not contain hardcoded password in test fill calls", () => {
    // Verify password fields use TEST_PASSWORD variable, not a literal
    const fillPasswordRegex = /\.fill\(.*password.*'([^']+)'\)/g;
    const matches = [...spec.matchAll(fillPasswordRegex)];
    for (const m of matches) {
      expect(m[1]).toContain("TEST_PASSWORD");
    }
  });

  it("uses E2E_TEST_PASSWORD environment variable", () => {
    expect(spec).toContain("E2E_TEST_PASSWORD");
  });

  it("uses E2E_TEST_EMAIL environment variable", () => {
    expect(spec).toContain("E2E_TEST_EMAIL");
  });

  it("reads credentials from process.env", () => {
    expect(spec).toContain("process.env.E2E_TEST_PASSWORD");
    expect(spec).toContain("process.env.E2E_TEST_EMAIL");
  });
});
