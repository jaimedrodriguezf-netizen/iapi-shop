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
