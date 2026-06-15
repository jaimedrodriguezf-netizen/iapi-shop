import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { readdirSync } from "node:fs";

const gitignore = readFileSync(".gitignore", "utf8");

describe(".gitignore security", () => {
  it("excludes scratch/ directory (debug scripts with secrets)", () => {
    expect(gitignore).toContain("/scratch/");
  });

  it("excludes .env files", () => {
    expect(gitignore).toContain(".env");
  });

  it("scratch/ directory does not contain debug scripts that log secrets", () => {
    const scratchExists = existsSync("scratch");
    const secretFiles = [
      "test-admin.js",
      "test-supabase.js",
      "test-anon.js",
      "list-products.js",
      "list-tenants.js",
    ];
    if (scratchExists) {
      const files = readdirSync("scratch");
      const remainingSecretFiles = files.filter((f) => secretFiles.includes(f));
      expect(remainingSecretFiles).toHaveLength(0);
    }
  });
});
