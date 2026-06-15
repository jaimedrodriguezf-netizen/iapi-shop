import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Ecuador Address Locations Database Migration", () => {
  const migrationPath = path.resolve(__dirname, "20260609220924_address_locations_ecuador.sql");

  it("should have the migration SQL file in the migrations folder", () => {
    const exists = fs.existsSync(migrationPath);
    expect(exists).toBe(true);
  });

  it("should contain DDL to create public.countries, public.provinces, and public.cantons tables with proper structure", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.countries");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.provinces");
    expect(content).toContain("CREATE TABLE IF NOT EXISTS public.cantons");

    // Table columns and constraints
    expect(content).toContain("name text UNIQUE NOT NULL");
    expect(content).toContain("code text UNIQUE NOT NULL");
    expect(content).toContain("country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE");
    expect(content).toContain("province_id uuid REFERENCES public.provinces(id) ON DELETE CASCADE");
    expect(content).toContain("UNIQUE(country_id, name)");
    expect(content).toContain("UNIQUE(province_id, name)");
  });

  it("should enable RLS on all three tables", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("ALTER TABLE public.cantons ENABLE ROW LEVEL SECURITY");
  });

  it("should create select-only RLS policies for all three tables", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("Allow public read access to countries");
    expect(content).toContain("Allow public read access to provinces");
    expect(content).toContain("Allow public read access to cantons");
  });

  it("should seed countries (Ecuador, Colombia, Peru)", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    expect(content).toContain("Ecuador");
    expect(content).toContain("EC");
    expect(content).toContain("Colombia");
    expect(content).toContain("CO");
    expect(content).toContain("Peru");
    expect(content).toContain("PE");
  });

  it("should seed Ecuador sub-regions (provinces and cantons)", () => {
    const content = fs.readFileSync(migrationPath, "utf-8");
    // Check some specific seeded provinces and cantons from the JSON reference
    expect(content).toContain("Azuay");
    expect(content).toContain("Cuenca");
    expect(content).toContain("Pichincha");
    expect(content).toContain("Quito");
    expect(content).toContain("Guayas");
    expect(content).toContain("Guayaquil");
  });
});
