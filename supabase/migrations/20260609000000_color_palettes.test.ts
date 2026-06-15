import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Color Palettes Database Migration", () => {
  const migrationPath = path.resolve(__dirname, "20260609000000_color_palettes.sql");

  it("should have the migration SQL file in the migrations folder", () => {
    const exists = fs.existsSync(migrationPath);
    expect(exists).toBe(true);
  });

  it("should contain DDL to create color_palettes table with appropriate columns", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.color_palettes");
    expect(content).toContain("id uuid PRIMARY KEY DEFAULT gen_random_uuid()");
    expect(content).toContain("name text UNIQUE NOT NULL");
    expect(content).toContain("brand_color text NOT NULL");
    expect(content).toContain("secondary_color text NOT NULL");
    expect(content).toContain("created_at timestamp with time zone DEFAULT now()");
  });

  it("should enable RLS on color_palettes table", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY");
  });

  it("should create a read-only policy for public access", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("CREATE POLICY \"Permitir lectura pública de paletas\"");
    expect(content).toContain("FOR SELECT TO public");
  });

  it("should insert seed data for preset palettes", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("INSERT INTO public.color_palettes");
    expect(content).toContain("Pastel");
    expect(content).toContain("Warm");
    expect(content).toContain("Neon");
    expect(content).toContain("Tech");
    expect(content).toContain("Nordic");
  });
});
