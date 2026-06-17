"use server";

import { createClient } from "@/lib/supabase/server";
import { CURRENT_LEGAL_VERSION } from "./constants";

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