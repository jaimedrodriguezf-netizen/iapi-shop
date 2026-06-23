"use client";

import { useState } from "react";
import { LEGAL_LINKS_ENABLED } from "@/lib/legal/constants";
import dynamic from "next/dynamic";

const StoreReportDialog = dynamic(
  () => import("@/components/legal/store-report-dialog").then((mod) => mod.StoreReportDialog),
  { ssr: false },
);

interface StoreReportButtonProps {
  tenantId: string;
  tenantName: string;
}

export function StoreReportButton({ tenantId }: StoreReportButtonProps) {
  const [open, setOpen] = useState(false);

  if (!LEGAL_LINKS_ENABLED) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition font-medium py-1"
      >
        Denunciar tienda
      </button>
      <StoreReportDialog
        tenantId={tenantId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}