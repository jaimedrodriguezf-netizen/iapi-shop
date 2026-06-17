"use server";

import { createClient } from "@/lib/supabase/server";
import { CURRENT_LEGAL_VERSION } from "./constants";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

/**
 * Accept the current legal terms. Updates all tenant_members rows for the
 * authenticated user with the current legal_version from site_settings and
 * sets legal_accepted_at to now().
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

    // Update all tenant_members rows for this user
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