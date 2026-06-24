import { headers } from "next/headers";

const ALLOWED_OAUTH_HOSTS: string[] = [
  "iapi.shop",
  "www.iapi.shop",
  "localhost:3000",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname]
    : []),
];

/**
 * Returns the site origin (protocol + host) from request headers,
 * validated against a whitelist to prevent host header injection.
 */
export async function getSiteOrigin(): Promise<string> {
  const heads = await headers();
  const rawHost = heads.get("x-forwarded-host") || heads.get("host") || "localhost:3000";
  const host = ALLOWED_OAUTH_HOSTS.includes(rawHost) ? rawHost : "localhost:3000";
  const proto = heads.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

/**
 * Validates that a URL for redirect purposes is safe:
 * - Must start with "/"
 * - Must NOT be protocol-relative (//)
 * - Must NOT contain javascript: or data: protocols
 */
export function isSafeRedirect(url: string): boolean {
  if (!url || !url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  if (url.startsWith("/\\")) return false;
  const lower = url.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("data:")) return false;
  return true;
}
