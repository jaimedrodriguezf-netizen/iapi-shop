"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { acceptLegalTerms } from "@/lib/legal/actions";

interface ReConsentBannerClientProps {
  currentVersion: string;
}

export function ReConsentBannerClient({ currentVersion }: ReConsentBannerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);

  if (accepted) return null;

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptLegalTerms();
      if (result.success) {
        setAccepted(true);
        toast.success("Términos aceptados correctamente.");
      } else {
        toast.error(result.error || "Error al aceptar los términos.");
      }
    });
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900/50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
          Hemos actualizado nuestros{" "}
          <Link
            href="/legal/terminos"
            className="font-bold underline underline-offset-2 hover:text-orange-900 dark:hover:text-orange-100"
          >
            Términos y Condiciones
          </Link>{" "}
          y{" "}
          <Link
            href="/legal/privacidad"
            className="font-bold underline underline-offset-2 hover:text-orange-900 dark:hover:text-orange-100"
          >
            Política de Privacidad
          </Link>
          . Debés aceptarlos nuevamente para continuar.
        </p>
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="shrink-0 rounded-xl bg-orange-accent hover:bg-orange-accent-hover disabled:bg-orange-accent/50 text-white text-sm font-bold px-4 py-2 transition active:scale-95 disabled:cursor-not-allowed"
        >
          {isPending ? "Procesando..." : "Aceptar"}
        </button>
      </div>
    </div>
  );
}