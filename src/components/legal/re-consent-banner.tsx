import { LEGAL_LINKS_ENABLED } from "@/lib/legal/constants";
import { checkReConsent } from "@/lib/legal/actions";
import { ReConsentBannerClient } from "./re-consent-banner-client";

interface ReConsentBannerProps {
  /** If true, this user is an admin and does NOT need to see the banner */
  isAdmin: boolean;
}

/**
 * Server component that checks legal version mismatch.
 * Delegates all data fetching to the checkReConsent server action.
 * If the user's accepted version differs from site_settings.legal_version,
 * renders a non-dismissible nag banner with an "Aceptar" button.
 */
export async function ReConsentBanner({ isAdmin }: ReConsentBannerProps) {
  if (!LEGAL_LINKS_ENABLED) return null;

  const result = await checkReConsent(isAdmin);

  // On error, don't show the banner — avoid blocking the dashboard for transient issues
  if (!result.success || !result.data.needsReAccept || !result.data.currentVersion) return null;

  return (
    <ReConsentBannerClient currentVersion={result.data.currentVersion} />
  );
}