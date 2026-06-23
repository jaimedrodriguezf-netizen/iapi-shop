import { jsPDF } from "jspdf";
import type { Product } from "@/lib/products/actions";

interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export function generateCotizacionPDF({
  tenantName,
  customerName,
  items,
  subtotal,
  discount,
  total,
}: {
  tenantName: string;
  customerName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
}) {
  const doc = new jsPDF();
  
  // Encabezado
  doc.setFontSize(22);
  doc.setTextColor(249, 115, 22); // orange-500
  doc.text(tenantName, 14, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Cotización de Productos", 14, 28);
  
  const fecha = new Date().toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 14, 34);
  
  if (customerName) {
    doc.text(`Cliente: ${customerName}`, 14, 40);
  }

  // Tabla
  let y = 50;
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text("Producto", 14, y);
  doc.text("Cant.", 120, y);
  doc.text("P.Unit", 140, y);
  doc.text("Subtotal", 170, y);
  
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 196, y + 2);
  y += 10;
  
  doc.setFont("helvetica", "normal");
  items.forEach((item) => {
    const itemName = item.product.name.substring(0, 50); // truncar si es muy largo
    const qty = item.quantity.toString();
    const price = `$${item.unitPrice.toFixed(2)}`;
    const lineTotal = `$${(item.quantity * item.unitPrice).toFixed(2)}`;
    
    doc.text(itemName, 14, y);
    doc.text(qty, 120, y);
    doc.text(price, 140, y);
    doc.text(lineTotal, 170, y);
    
    y += 10;
  });
  
  // Totales
  y += 10;
  doc.line(14, y - 5, 196, y - 5);
  
  doc.text("Subtotal:", 140, y);
  doc.text(`$${subtotal.toFixed(2)}`, 170, y);
  
  y += 8;
  doc.text(`Descuento (${discount}%):`, 140, y);
  doc.text(`-$${((subtotal * discount) / 100).toFixed(2)}`, 170, y);
  
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("TOTAL:", 140, y);
  doc.text(`$${total.toFixed(2)}`, 170, y);

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text("Cotización generada por IAPI Shop", 105, 280, { align: "center" });

  doc.save(`Cotizacion-${tenantName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
