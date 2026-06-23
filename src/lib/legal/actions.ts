"use server";

import { createClient } from "@/lib/supabase/server";
import { CURRENT_LEGAL_VERSION, REPORT_REASONS } from "./constants";
import type { ReportReason, ReportStatus } from "./constants";
import { reportRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Accept the current legal terms. Updates all tenant_members rows for the
 * authenticated user with the current legal_version from site_settings and
 * sets legal_accepted_at to now().
 *
 * Intentionally uses user_id-only filter (no tenant_id) because legal consent
 * must be accepted across ALL tenants the user belongs to — a user who accepts
 * legal terms does so for all their memberships simultaneously.
 *
 * Idempotent — calling multiple times is safe, it just updates the timestamp.
 */
export async function acceptLegalTerms(): Promise<ActionResult<{ version: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Read current legal version from site_settings
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("legal_version")
      .single();

    const legalVersion = siteSettings?.legal_version || CURRENT_LEGAL_VERSION;

    // Update all tenant_members rows for this user across all tenants
    const { error: updateError } = await supabase
      .from("tenant_members")
      .update({
        legal_accepted_version: legalVersion,
        legal_accepted_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("acceptLegalTerms update error:", updateError);
      return { success: false, error: "Error al aceptar los términos" };
    }

    return { success: true, data: { version: legalVersion } };
  } catch (error) {
    console.error("acceptLegalTerms error:", error);
    return { success: false, error: "Error al aceptar los términos" };
  }
}

/**
 * Check whether the current user needs to re-accept legal terms.
 * Returns structured result with needsReAccept and currentVersion.
 * Admins never need to re-accept.
 *
 * Intentionally queries tenant_members with user_id-only filter:
 * we check any membership row to determine if the user has accepted
 * the current version. If any row is outdated, the entire user needs re-consent.
 */
export async function checkReConsent(isAdmin: boolean): Promise<
  ActionResult<{ needsReAccept: boolean; currentVersion?: string }>
> {
  try {
    if (isAdmin) {
      return { success: true, data: { needsReAccept: false } };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: { needsReAccept: false } };
    }

    // Read site-wide legal version
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("legal_version")
      .single();

    const currentVersion = siteSettings?.legal_version || CURRENT_LEGAL_VERSION;

    // Read user's accepted version from tenant_members
    const { data: member } = await supabase
      .from("tenant_members")
      .select("legal_accepted_version")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const acceptedVersion = member?.legal_accepted_version;

    if (acceptedVersion !== currentVersion) {
      return { success: true, data: { needsReAccept: true, currentVersion } };
    }

    return { success: true, data: { needsReAccept: false } };
  } catch (error) {
    console.error("checkReConsent error:", error);
    // On error, return structured error — caller decides fallback behavior
    return { success: false, error: "Error al verificar términos legales" };
  }
}

// ─── Store Reporting ────────────────────────────────────────────────────────

const submitReportSchema = z.object({
  tenant_id: z.string().uuid("ID de tienda inválido"),
  reporter_email: z.string().email("Correo electrónico inválido"),
  reason: z.enum(REPORT_REASONS, { message: "Motivo de denuncia inválido" }),
  details: z.string().min(1, "Los detalles son requeridos").max(2000, "Los detalles no pueden exceder 2000 caracteres"),
});

/** Strip HTML tags and trim whitespace */
function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export interface StoreReport {
  id: string;
  tenant_id: string;
  reporter_email: string;
  reason: string;
  details: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Submit a store report (anonymous, rate-limited).
 * Validates input, strips HTML, verifies tenant exists, then inserts.
 */
export async function submitStoreReport(input: {
  tenant_id: string;
  reporter_email: string;
  reason: ReportReason;
  details: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    // Rate limiting
    const identifier = await getClientIdentifier();
    const rateResult = await reportRateLimit.limit(identifier);
    if (!rateResult.success) {
      return { success: false, error: "Demasiados intentos. Intentá de nuevo en 15 minutos." };
    }

    // Validate input
    const validated = submitReportSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError.message };
    }

    // Sanitize
    const sanitizedDetails = sanitizeHtml(validated.data.details);

    // Verify tenant exists
    const supabase = await createClient();
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", validated.data.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: "Tienda no encontrada" };
    }

    // Insert report
    const { data: report, error: insertError } = await supabase
      .from("store_reports")
      .insert({
        tenant_id: validated.data.tenant_id,
        reporter_email: validated.data.reporter_email,
        reason: validated.data.reason,
        details: sanitizedDetails,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !report) {
      console.error("submitStoreReport insert error:", insertError);
      return { success: false, error: "Error al enviar la denuncia" };
    }

    return { success: true, data: { id: report.id } };
  } catch (error) {
    console.error("submitStoreReport error:", error);
    return { success: false, error: "Error al enviar la denuncia" };
  }
}

/**
 * Get pending store reports — admin only.
 * Returns all reports with status "pending", ordered by created_at DESC.
 */
export async function getPendingReports(): Promise<ActionResult<StoreReport[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Check admin role — use .limit(1) since a user may have multiple memberships
    const { data: members, error: memberError } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("user_id", user.id)
      .limit(1);

    const member = members?.[0];
    if (memberError || !member || member.role !== "platform_admin") {
      return { success: false, error: "Acceso restringido a administradores" };
    }

    // Fetch pending reports
    const { data: reports, error: fetchError } = await supabase
      .from("store_reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("getPendingReports fetch error:", fetchError);
      return { success: false, error: "Error al cargar reportes" };
    }

    return { success: true, data: (reports || []) as StoreReport[] };
  } catch (error) {
    console.error("getPendingReports error:", error);
    return { success: false, error: "Error al cargar reportes" };
  }
}

const updateStatusSchema = z.object({
  status: z.enum(["reviewed", "actioned", "dismissed"] as const, {
    message: "Estado de reporte inválido",
  }),
  moderator_notes: z.string().optional(),
});

/**
 * Update a report's status and optionally add moderator notes — admin only.
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  notes?: string,
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "No autorizado" };
    }

    // Check admin role — use .limit(1) since a user may have multiple memberships
    const { data: members, error: memberError } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("user_id", user.id)
      .limit(1);

    const member = members?.[0];
    if (memberError || !member || member.role !== "platform_admin") {
      return { success: false, error: "Acceso restringido a administradores" };
    }

    // Validate status enum
    const validated = updateStatusSchema.safeParse({ status, moderator_notes: notes });
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError.message };
    }

    // Update report
    const updateData: Record<string, unknown> = {
      status: validated.data.status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      updateData.moderator_notes = notes;
    }

    const { error: updateError } = await supabase
      .from("store_reports")
      .update(updateData)
      .eq("id", reportId);

    if (updateError) {
      console.error("updateReportStatus update error:", updateError);
      return { success: false, error: "Error al actualizar el reporte" };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error("updateReportStatus error:", error);
    return { success: false, error: "Error al actualizar el reporte" };
  }
}