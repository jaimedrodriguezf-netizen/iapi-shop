/**
 * Legal compliance constants for Ecuadorean legislation (LCE, LODC, LOPDP).
 * Feature flag gates all legal UI touchpoints for instant rollback.
 */

export const LEGAL_LINKS_ENABLED = true;

export const CURRENT_LEGAL_VERSION = "1";

export const REPORT_REASONS = [
  "Productos ilegales",
  "Estafa/fraude",
  "Contenido inapropiado",
  "Suplantación de identidad",
  "Otro",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";
