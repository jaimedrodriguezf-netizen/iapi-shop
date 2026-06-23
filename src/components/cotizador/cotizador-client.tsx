"use client";

import { useState } from "react";
import type { Product } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, FileText, Send } from "lucide-react";
import { generateCotizacionPDF } from "./pdf-generator";

interface CotizadorClientProps {
  initialProducts: Product[];
  tenantName: string;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export function CotizadorClient({ initialProducts, tenantName }: CotizadorClientProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState<number>(0);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId) {
          const newQ = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQ };
        }
        return i;
      })
    );
  };

  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handleDownloadPDF = () => {
    generateCotizacionPDF({
      tenantName,
      customerName,
      items,
      subtotal,
      discount,
      total
    });
  };

  const handleWhatsApp = () => {
    let msg = `*Cotización - ${tenantName}*\n\n`;
    if (customerName) msg += `Cliente: ${customerName}\n\n`;
    
    items.forEach(i => {
      msg += `▪ ${i.quantity}x ${i.product.name} - $${(i.quantity * i.unitPrice).toFixed(2)}\n`;
    });
    
    msg += `\n*Subtotal:* $${subtotal.toFixed(2)}\n`;
    if (discount > 0) {
      msg += `*Descuento (${discount}%):* -$${discountAmount.toFixed(2)}\n`;
    }
    msg += `*TOTAL: $${total.toFixed(2)}*\n\n`;
    msg += `¡Gracias por tu preferencia!`;

    const encoded = encodeURIComponent(msg);
    const phone = customerPhone.replace(/\D/g, "");
    
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Selector de Productos */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Productos</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {initialProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 border rounded-2xl">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">${Number(p.price).toFixed(2)}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => addItem(p)}
                  data-testid={`add-product-${p.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {initialProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No tienes productos en tu catálogo.</p>
            )}
          </div>
        </div>

        {/* Lista de Cotización */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Detalle de Cotización</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no has agregado productos a la cotización
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">${Number(item.unitPrice).toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-bold text-sm w-16 text-right">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen y Cliente */}
      <div className="space-y-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">Datos del Cliente</h3>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Nombre (Opcional)</label>
            <Input 
              placeholder="Ej. Juan Pérez" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Teléfono WhatsApp</label>
            <Input 
              placeholder="Ej. 0991234567" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)} 
            />
          </div>
        </div>

        <div className="rounded-3xl border bg-slate-900 text-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold">Resumen</h3>
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-400">Descuento (%)</span>
            <Input 
              type="number" 
              className="w-20 h-8 text-right bg-slate-800 border-slate-700" 
              value={discount} 
              onChange={(e) => setDiscount(Number(e.target.value))} 
              min={0} max={100}
            />
          </div>

          <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
            <span className="font-bold">Total</span>
            <span className="text-2xl font-black text-orange-400">${total.toFixed(2)}</span>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full bg-white text-slate-900 hover:bg-slate-100" 
              disabled={items.length === 0}
              onClick={handleDownloadPDF}
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button 
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white" 
              disabled={items.length === 0}
              onClick={handleWhatsApp}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
