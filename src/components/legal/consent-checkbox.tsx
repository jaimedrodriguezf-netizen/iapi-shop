"use client";

import { LEGAL_LINKS_ENABLED } from "@/lib/legal/constants";
import Link from "next/link";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ConsentCheckbox({ checked, onChange, disabled = false }: ConsentCheckboxProps) {
  if (!LEGAL_LINKS_ENABLED) {
    return null;
  }

  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded-xl border-zinc-300 dark:border-zinc-700 accent-orange-500 focus:ring-orange-accent/20"
        aria-label="Acepto los Términos y Condiciones y la Política de Privacidad"
      />
      <span className="text-xs text-muted-foreground leading-relaxed">
        Acepto los{" "}
        <Link
          href="/legal/terminos"
          className="font-bold text-orange-accent hover:text-orange-accent-hover underline underline-offset-2"
        >
          Términos y Condiciones
        </Link>{" "}
        y la{" "}
        <Link
          href="/legal/privacidad"
          className="font-bold text-orange-accent hover:text-orange-accent-hover underline underline-offset-2"
        >
          Política de Privacidad
        </Link>{" "}
        de Tenddy Shop.
      </span>
    </label>
  );
}