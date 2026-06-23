"use client"

import * as React from "react"
import { Download, ExternalLink, FileText, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { toast } from "sonner"
import { jsPDF } from "jspdf"

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
      toast.success("Código QR (PNG) descargado correctamente.")
    } catch (error) {
      toast.error("Error al descargar el código QR.")
    }
  }

  const downloadPDF = async () => {
    const toastId = toast.loading("Generando PDF de alta calidad para imprimir...")
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = doc.internal.pageSize.getWidth() // 297
      const pageHeight = doc.internal.pageSize.getHeight() // 210
      const halfWidth = pageWidth / 2 // 148.5

      // Draw left and right halves
      for (let i = 0; i < 2; i++) {
        const xOffset = i * halfWidth

        // 1. (Logo image removed, using text below)

        // 2. IAPI Shop Text
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.setTextColor(148, 163, 184) // slate-400
        doc.text("IAPI SHOP", xOffset + halfWidth / 2, 42, { align: "center" })

        // 3. Store Name (Title)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.setTextColor(249, 115, 22) // orange-500
        doc.text(tenantName.toUpperCase(), xOffset + halfWidth / 2, 54, { align: "center" })

        // 4. Instruction
        doc.setFont("helvetica", "normal")
        doc.setFontSize(11)
        doc.setTextColor(71, 85, 105) // slate-600
        doc.text("Escanea el código QR para ver nuestro catálogo", xOffset + halfWidth / 2, 64, { align: "center" })

        // 5. Draw QR Code
        doc.addImage(qrDataUrl, "PNG", xOffset + halfWidth / 2 - 35, 74, 70, 70)

        // 6. Scan helper text
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.setTextColor(249, 115, 22) // orange-500
        doc.text("¡ESCANEA Y PIDE!", xOffset + halfWidth / 2, 154, { align: "center" })

        // 7. Store URL
        doc.setFont("courier", "normal")
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139) // slate-500
        doc.text(publicUrl, xOffset + halfWidth / 2, 164, { align: "center" })
      }

      // Draw dotted fold/cut line in the middle
      doc.setLineDashPattern([2, 2], 0)
      doc.setDrawColor(200, 200, 200)
      doc.line(halfWidth, 0, halfWidth, pageHeight)

      // Save PDF
      doc.save(`QR-${tenantName.replace(/\s+/g, "-")}-A4.pdf`)
      toast.success("PDF A4 horizontal descargado con éxito.", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error("Error al generar el PDF de impresión.", { id: toastId })
    }
  }

  const openPublicView = () => {
    window.open(publicUrl, "_blank")
    toast.info("Abriendo vista pública del catálogo...")
  }

  return (
    <Card className="rounded-3xl border shadow-lg overflow-hidden">
      <CardHeader className="bg-orange-50 dark:bg-orange-950/20 text-center py-8">
        <CardTitle className="text-xl font-black text-orange-500 uppercase tracking-widest flex flex-col items-center justify-center gap-2">
          <Logo className="text-2xl" />
          <span className="mt-2 flex items-center gap-2 text-sm"><QrCode className="h-5 w-5" /> Escanea & Pide</span>
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
        <div className="mt-8 text-center space-y-2 w-full max-w-md">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter">Link de tu sucursal</p>
          <code className="block bg-muted p-3 rounded-xl text-xs font-mono break-all border">
            {publicUrl}
          </code>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 p-6 bg-muted/50 border-t w-full">
        <Button 
          variant="outline" 
          className="w-full rounded-xl font-bold border-orange-200 hover:bg-orange-50 transition-colors py-6 shadow-sm"
          onClick={openPublicView}
        >
          <ExternalLink className="mr-2 h-4 w-4 text-orange-500" /> Probar Vista Pública
        </Button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <Button 
            className="rounded-xl font-bold bg-orange-500 hover:bg-orange-600 shadow-md py-6 text-white"
            onClick={downloadPDF}
          >
            <FileText className="mr-2 h-4 w-4" /> PDF de Mesa (A4)
          </Button>
          <Button 
            variant="secondary"
            className="rounded-xl font-bold border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors py-6"
            onClick={downloadQR}
          >
            <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Descargar PNG
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
