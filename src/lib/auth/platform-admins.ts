import { createClient } from "@/lib/supabase/server";

const bootstrapPlatformAdminEmails = new Set(["admin@iapi.shop"]);

export type PlatformRole = "admin";

export function isBootstrapPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return bootstrapPlatformAdminEmails.has(email.trim().toLowerCase());
}

export function getBootstrapPlatformRole(email: string | null | undefined): PlatformRole | null {
  return isBootstrapPlatformAdminEmail(email) ? "admin" : null;
}

export async function isPlatformAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (email && isBootstrapPlatformAdminEmail(email)) {
    return true;
  }
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_admins")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data.role === "admin";
    }
  } catch (err) {
    console.error("isPlatformAdmin error:", err);
  }
  
  return false;
}
