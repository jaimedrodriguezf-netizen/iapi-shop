import { jsPDF } from "jspdf";

export function generateReceiptPDF({
  tenantName,
  amount,
  concept,
  customerName,
  customerId,
  paymentMethod,
  date
}: {
  tenantName: string;
  amount: number;
  concept: string;
  customerName: string;
  customerId: string;
  paymentMethod: string;
  date: Date;
}) {
  // Configuración para un ticket/recibo moderno (vertical)
  // Formato tipo A6 (aprox 105 x 148 mm) que se ve bien en móviles
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6"
  });
  
  const width = doc.internal.pageSize.getWidth();
  
  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(tenantName, width / 2, 20, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("RECIBO DE CAJA", width / 2, 26, { align: "center" });
  
  // Separador
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 32, width - 10, 32);
  
  // Datos principales
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // slate-700
  let y = 40;
  
  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(date.toLocaleDateString("es-ES"), width - 10, y, { align: "right" });
  
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Recibí de:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(customerName || "Consumidor Final", width - 10, y, { align: "right" });
  
  if (customerId) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("RUC/CI:", 10, y);
    doc.setFont("helvetica", "normal");
    doc.text(customerId, width - 10, y, { align: "right" });
  }
  
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Por concepto de:", 10, y);
  y += 6;
  doc.setFont("helvetica", "italic");
  // Multi-line concept
  const splitConcept = doc.splitTextToSize(concept, width - 20);
  doc.text(splitConcept, 10, y);
  y += (splitConcept.length * 5) + 4;
  
  doc.setFont("helvetica", "bold");
  doc.text("Método de pago:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(paymentMethod, width - 10, y, { align: "right" });
  
  // Separador Total
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(10, y, width - 10, y);
  
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("LA SUMA DE:", 10, y);
  
  doc.setFontSize(18);
  doc.setTextColor(249, 115, 22); // orange-500
  doc.text(`$${amount.toFixed(2)}`, width - 10, y, { align: "right" });
  
  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "normal");
  doc.text("Recibo generado digitalmente", width / 2, y, { align: "center" });

  doc.save(`Recibo-${tenantName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
