"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ShoppingBag, ArrowRight, Sparkles, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MotionProduct {
  id: string;
  name: string;
  price: number;
  src: string;
  category: string;
}

const TICKER_PRODUCTS: MotionProduct[] = [
  { id: "p1", name: "Zapatilla Urbana", price: 89.99, src: "/sneaker.png", category: "Calzado" },
  { id: "p2", name: "Perfume Minimalista", price: 54.50, src: "/perfume.png", category: "Fragancias" },
  { id: "p3", name: "Reloj Inteligente", price: 129.00, src: "/watch.png", category: "Tecnología" },
];

const DOUBLE_PRODUCTS: MotionProduct[] = [
  ...TICKER_PRODUCTS,
  ...TICKER_PRODUCTS,
  ...TICKER_PRODUCTS,
  ...TICKER_PRODUCTS,
];

export function StorefrontMotionCanvas() {
  const [cartCount, setCartCount] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [flyEffect, setFlyEffect] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    if (isAdding) return;
    setIsAdding(true);
    setFlyEffect(true);

    // Particle/flying effect duration
    setTimeout(() => {
      setCartCount((prev) => prev + 1);
      setFlyEffect(false);
      setIsAdding(false);
      setShowToast(true);
    }, 600);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="w-full space-y-12">
      {/* 1. Infinite Product Marquee Ticker */}
      <div className="relative w-full overflow-hidden py-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
        {/* Left/Right blur overlays */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-6 flex px-4">
          {DOUBLE_PRODUCTS.map((prod, index) => (
            <div
              key={`${prod.id}-${index}`}
              className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-3 shrink-0 shadow-sm w-72"
            >
              <div className="relative h-16 w-16 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-hidden shrink-0 border dark:border-zinc-800 flex items-center justify-center">
                <Image
                  src={prod.src}
                  alt={`Producto marquee: ${prod.name}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-violet-600 dark:text-violet-400 uppercase">
                  {prod.category}
                </span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200 truncate">{prod.name}</h4>
                <p className="font-black text-sm text-slate-900 dark:text-white mt-0.5 tabular-nums">
                  ${prod.price.toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Interactive Storefront Mockup Canvas */}
      <div className="mx-auto max-w-lg rounded-3xl border border-white bg-white/60 p-4 sm:p-6 shadow-2xl shadow-violet-950/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60 relative">
        
        {/* Glow backdrop */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-violet-500/10 via-transparent to-transparent rounded-3xl blur-2xl -z-10" />

        {/* Mobile Phone Mockup */}
        <div className="rounded-3xl border-8 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black aspect-[9/18] shadow-2xl overflow-hidden relative flex flex-col justify-between">
          
          {/* Top Notch bar */}
          <div className="h-6 w-full bg-white dark:bg-zinc-900 border-b flex items-center justify-between px-6 text-[10px] font-bold text-muted-foreground">
            <span>9:41 AM</span>
            <div className="h-3 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto" />
            <span>5G</span>
          </div>

          {/* Shop Header */}
          <div className="bg-white dark:bg-zinc-900 border-b p-4 flex justify-between items-center relative z-20">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Catálogo Digital
              </span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">UrbanStreet S.A.</h3>
            </div>
            
            {/* Storefront Cart Icon */}
            <div className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
              <ShoppingBag className="h-4.5 w-4.5" />
              <span
                data-testid="cart-badge"
                className={cn(
                  "absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white transition-all duration-300",
                  cartCount > 0 ? "scale-100 animate-bounce" : "scale-100"
                )}
              >
                {cartCount}
              </span>
            </div>
          </div>

          {/* Simulated Toast Notification */}
          {showToast && (
            <div className="absolute top-20 inset-x-4 bg-slate-900/90 text-white p-2.5 rounded-xl text-[11px] font-bold text-center flex items-center justify-center gap-1.5 backdrop-blur z-30 shadow animate-in fade-in slide-in-from-top-4 duration-300">
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span>Agregado al carrito de WhatsApp!</span>
            </div>
          )}

          {/* Main Shop catalog mock */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 relative">
            <div className="rounded-3xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4 space-y-4 shadow-sm">
              <div className="aspect-square w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 relative overflow-hidden flex items-center justify-center p-4">
                <Image
                  src="/sneaker.png"
                  alt="Sneaker Showcase"
                  fill
                  sizes="250px"
                  className="object-contain p-2"
                />

                {/* Flying particle visual element */}
                {flyEffect && (
                  <div
                    className="absolute h-10 w-10 bg-violet-600 rounded-full flex items-center justify-center text-white border border-white"
                    style={{
                      animation: "flyToCart 0.6s cubic-bezier(0.25, 1, 0.50, 1) forwards",
                      boxShadow: "0 10px 20px rgba(124, 58, 237, 0.4)",
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Calzado Deportivo</span>
                <h4 className="font-bold text-base mt-0.5">Zapatilla Urbana Max</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Amortiguación avanzada y suela de alta tracción para uso diario.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-black text-slate-900 dark:text-white text-lg">$89.99</span>
                <button
                  type="button"
                  aria-label="Agregar al carrito"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="rounded-xl px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Comprar
                </button>
              </div>
            </div>
          </div>

          {/* Shop Footer */}
          <div className="bg-white dark:bg-zinc-900 border-t p-3 text-center text-[9px] text-muted-foreground uppercase font-black tracking-widest">
            iapi-shop checkout
          </div>
        </div>

        {/* Instructions Caption below the Phone */}
        <div className="text-center mt-4 px-2">
          <p className="text-xs text-muted-foreground font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-violet-500 inline-block mr-1.5 align-text-bottom" />
            Hacé clic en <span className="text-violet-600 dark:text-violet-400 font-extrabold">Comprar</span> para ver la simulación del flujo de pedido.
          </p>
        </div>
      </div>

      {/* CSS Keyframes for flying effect */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flyToCart {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: scale(0.2) translate(110px, -230px);
            opacity: 0.2;
          }
        }
      `}} />
    </div>
  );
}
