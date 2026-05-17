"use client"

import * as React from "react"
import { Download, ExternalLink, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { toast } from "sonner"

interface QRViewClientProps {
  qrDataUrl: string
  publicUrl: string
  tenantName: string
}

export function QRViewClient({ qrDataUrl, publicUrl, tenantName }: QRViewClientProps) {
  const downloadQR = () => {
    try {
      const link = document.createElement("a")
      link.href = qrDataUrl
      link.download = `QR-${tenantName.replace(/\s+/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Código QR descargado correctamente.")
    } catch (error) {
      toast.error("Error al descargar el código QR.")
    }
  }

  const openPublicView = () => {
    window.open(publicUrl, "_blank")
    toast.info("Abriendo vista pública del catálogo...")
  }

  return (
    <Card className="rounded-3xl border shadow-lg overflow-hidden">
      <CardHeader className="bg-orange-50 dark:bg-orange-950/20 text-center py-8">
        <CardTitle className="text-xl font-black text-orange-600 uppercase tracking-widest flex items-center justify-center gap-2">
          <QrCode className="h-6 w-6" /> Escanea & Pide
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900">
        <div className="relative h-64 w-64 p-4 rounded-3xl border-4 border-orange-100 bg-white shadow-inner">
          <Image 
            src={qrDataUrl} 
            alt="Código QR de la sucursal" 
            width={512} 
            height={512}
            className="w-full h-full"
          />
        </div>
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">Link de tu sucursal</p>
          <code className="block bg-muted p-3 rounded-xl text-xs font-mono break-all border">
            {publicUrl}
          </code>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 p-6 bg-muted/50 border-t">
        <Button 
          variant="outline" 
          className="w-full rounded-xl font-bold border-orange-200 hover:bg-orange-50 transition-colors"
          onClick={openPublicView}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Probar Vista Pública
        </Button>
        <Button 
          className="w-full rounded-xl font-bold bg-orange-600 hover:bg-orange-700 shadow-md"
          onClick={downloadQR}
        >
          <Download className="mr-2 h-4 w-4" /> Descargar PNG
        </Button>
      </CardFooter>
    </Card>
  )
}
