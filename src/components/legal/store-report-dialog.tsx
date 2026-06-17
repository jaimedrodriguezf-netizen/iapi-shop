"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitStoreReport } from "@/lib/legal/actions";
import type { ReportReason } from "@/lib/legal/constants";
import { REPORT_REASONS } from "@/lib/legal/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Send } from "lucide-react";

interface StoreReportDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreReportDialog({ tenantId, open, onOpenChange }: StoreReportDialogProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isPending, startTransition] = useTransition();

  const detailsCharCount = details.length;
  const maxDetailsLength = 2000;

  const isValid =
    email.trim() !== "" &&
    reason !== "" &&
    details.trim() !== "" &&
    detailsCharCount <= maxDetailsLength &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleClose() {
    if (!isPending) {
      setEmail("");
      setReason("");
      setDetails("");
      onOpenChange(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isPending) return;

    startTransition(async () => {
      const result = await submitStoreReport({
        tenant_id: tenantId,
        reporter_email: email.trim(),
        reason: reason as ReportReason,
        details,
      });

      if (result.success) {
        toast.success("Denuncia enviada correctamente. Gracias por ayudarnos a mejorar.");
        setEmail("");
        setReason("");
        setDetails("");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Error al enviar la denuncia");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Denunciar tienda</h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Si esta tienda viola nuestras políticas, podés reportarla. Tu denuncia será revisada por nuestro equipo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reporter_email" className="text-sm font-medium">
              Tu correo electrónico
            </Label>
            <Input
              id="reporter_email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              className="rounded-xl"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="report_reason" className="text-sm font-medium">
              Motivo de la denuncia
            </Label>
            <select
              id="report_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason | "")}
              disabled={isPending}
              required
              className="w-full h-9 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccioná un motivo</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label htmlFor="report_details" className="text-sm font-medium">
              Detalles
            </Label>
            <Textarea
              id="report_details"
              placeholder="Describí el problema..."
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, maxDetailsLength))}
              disabled={isPending}
              required
              rows={4}
              className="rounded-xl resize-none"
            />
            <p className={`text-xs ${detailsCharCount > maxDetailsLength * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
              {detailsCharCount}/{maxDetailsLength} caracteres
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isValid || isPending}
            className="w-full rounded-xl font-bold"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar denuncia
              </>
            )}
          </Button>

          {!isValid && email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Ingresá un correo electrónico válido</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}