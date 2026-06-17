import Link from "next/link";
import { LEGAL_LINKS_ENABLED } from "@/lib/legal/constants";

/**
 * Renders "Términos y Condiciones" and "Política de Privacidad" links.
 * Gated by LEGAL_LINKS_ENABLED — returns null when flag is false.
 * Can render inline (for storefront) or in a column (for landing page).
 */
interface LegalFooterLinksProps {
  /** Render mode: "inline" for single-line text, "column" for stacked links */
  mode?: "inline" | "column";
  /** Separator text for inline mode (default: " | ") */
  separator?: string;
}

export function LegalFooterLinks({ mode = "column", separator = " | " }: LegalFooterLinksProps) {
  if (!LEGAL_LINKS_ENABLED) return null;

  if (mode === "inline") {
    return (
      <span className="text-xs text-muted-foreground">
        <Link
          href="/legal/terminos"
          className="font-medium hover:text-orange-accent transition-colors"
        >
          Términos
        </Link>
        {separator}
        <Link
          href="/legal/privacidad"
          className="font-medium hover:text-orange-accent transition-colors"
        >
          Privacidad
        </Link>
      </span>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
      <Link
        href="/legal/terminos"
        className="font-medium hover:text-orange-accent transition-colors"
      >
        Términos y Condiciones
      </Link>
      <span aria-hidden="true" className="hidden sm:inline">•</span>
      <Link
        href="/legal/privacidad"
        className="font-medium hover:text-orange-accent transition-colors"
      >
        Política de Privacidad
      </Link>
    </div>
  );
}