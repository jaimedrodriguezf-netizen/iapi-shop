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
