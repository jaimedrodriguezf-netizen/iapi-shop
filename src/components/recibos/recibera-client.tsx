"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Send, Receipt } from "lucide-react";
import { generateReceiptPDF } from "./pdf-receipt-generator";

interface ReciberaClientProps {
  tenantName: string;
}

export function ReciberaClient({ tenantName }: ReciberaClientProps) {
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");

  // Basic validation: amount must be > 0 and concept must not be empty
  const isValid = Number(amount) > 0 && concept.trim().length > 0;

  const handleDownloadPDF = () => {
    generateReceiptPDF({
      tenantName,
      amount: Number(amount),
      concept,
      customerName,
      customerId,
      paymentMethod,
      date: new Date()
    });
  };

  const handleWhatsApp = () => {
    let msg = `*Recibo de Caja - ${tenantName}*\n\n`;
    msg += `*Fecha:* ${new Date().toLocaleDateString("es-ES")}\n`;
    if (customerName) msg += `*Recibí de:* ${customerName}\n`;
    if (customerId) msg += `*RUC/CI:* ${customerId}\n`;
    
    msg += `\n*La suma de:* $${Number(amount).toFixed(2)}\n`;
    msg += `*Por concepto de:* ${concept}\n`;
    msg += `*Método de pago:* ${paymentMethod}\n\n`;
    msg += `¡Gracias!`;

    const encoded = encodeURIComponent(msg);
    const phone = customerPhone.replace(/\D/g, "");
    
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
      {/* Formulario */}
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold">Crear Recibo</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-semibold">Monto Recibido ($) *</label>
              <Input 
                id="amount"
                type="number"
                placeholder="Ej. 100.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                min={0}
                step={0.01}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="concept" className="text-sm font-semibold">Concepto *</label>
              <Input 
                id="concept"
                placeholder="Ej. Abono por mercadería" 
                value={concept} 
                onChange={(e) => setConcept(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Método de Pago</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                <option value="Deuna">Deuna</option>
                <option value="PayPhone">PayPhone</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">Datos del Cliente (Opcional)</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm font-semibold">Nombre del Cliente</label>
              <Input 
                id="customerName"
                placeholder="Ej. Juan Pérez" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">RUC / CI</label>
              <Input 
                placeholder="Ej. 0912345678" 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Teléfono WhatsApp</label>
              <Input 
                placeholder="Ej. 0991234567" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vista Previa y Acciones */}
      <div className="space-y-6">
        <div className="rounded-3xl border bg-slate-50 p-6 shadow-inner relative">
          {/* Diseño visual de un recibo ticket */}
          <div className="bg-white border-x border-t border-dashed border-b-0 border-slate-300 p-8 w-full max-w-sm mx-auto shadow-sm relative overflow-hidden">
            <div className="text-center mb-6">
              <h4 className="font-black text-xl text-slate-900">{tenantName}</h4>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Recibo de Caja</p>
            </div>
            
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Fecha:</span>
                <span>{new Date().toLocaleDateString("es-ES")}</span>
              </div>
              
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Recibí de:</span>
                <span className="text-right">{customerName || "Consumidor Final"}</span>
              </div>

              {customerId && (
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">RUC/CI:</span>
                  <span className="text-right">{customerId}</span>
                </div>
              )}
              
              <div className="pt-2">
                <span className="font-semibold text-slate-500 block mb-1">Por concepto de:</span>
                <p className="bg-slate-50 p-2 rounded text-xs min-h-[40px] italic">
                  {concept || "..."}
                </p>
              </div>

              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 pt-2">
                <span className="font-semibold text-slate-500">Método:</span>
                <span>{paymentMethod}</span>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <span className="font-black text-slate-900 uppercase">La suma de:</span>
                <span className="text-2xl font-black text-orange-500">${Number(amount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Borde aserrado abajo */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-50" style={{ maskImage: 'radial-gradient(circle at 4px 4px, transparent 4px, black 5px)', maskSize: '8px 8px', maskPosition: '-4px -4px' }}></div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-3">
          <Button 
            className="w-full bg-slate-900 text-white hover:bg-slate-800" 
            disabled={!isValid}
            onClick={handleDownloadPDF}
            data-testid="download-pdf-btn"
          >
            <FileText className="w-4 h-4 mr-2" />
            Descargar Recibo en PDF
          </Button>
          <Button 
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white" 
            disabled={!isValid}
            onClick={handleWhatsApp}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Recibo por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
