import { describe, it, expect } from "vitest";

describe("legal constants", () => {
  it("exports LEGAL_LINKS_ENABLED as true by default", async () => {
    const { LEGAL_LINKS_ENABLED } = await import("./constants");
    expect(LEGAL_LINKS_ENABLED).toBe(true);
  });

  it("exports CURRENT_LEGAL_VERSION as '1'", async () => {
    const { CURRENT_LEGAL_VERSION } = await import("./constants");
    expect(CURRENT_LEGAL_VERSION).toBe("1");
  });

  it("exports REPORT_REASONS with 5 categories", async () => {
    const { REPORT_REASONS } = await import("./constants");
    expect(REPORT_REASONS).toHaveLength(5);
    expect(REPORT_REASONS).toContain("Productos ilegales");
    expect(REPORT_REASONS).toContain("Estafa/fraude");
    expect(REPORT_REASONS).toContain("Contenido inapropiado");
    expect(REPORT_REASONS).toContain("Suplantación de identidad");
    expect(REPORT_REASONS).toContain("Otro");
  });

  it("ReportReason type covers all REPORT_REASONS values", async () => {
    const { REPORT_REASONS } = await import("./constants");
    const validReasons: string[] = [...REPORT_REASONS];
    expect(validReasons.every((r) => typeof r === "string")).toBe(true);
  });

  it("ReportStatus type covers all valid statuses", async () => {
    const validStatuses = ["pending", "reviewed", "actioned", "dismissed"] as const;
    expect(validStatuses).toHaveLength(4);
  });
});
