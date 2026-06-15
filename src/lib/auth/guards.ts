"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies that the authenticated user is a member of the specified tenant.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 */
export async function assertTenantMember(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { ok: false, error: "No autorizado" };
  }

  const { data: member, error: memberError } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return { ok: false, error: "No autorizado" };
  }

  return { ok: true };
}