"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Sparkles, Palette, Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowcaseProduct {
  id: string;
  name: string;
  src: string;
  desc: string;
}

export interface ShowcaseBackground {
  id: string;
  name: string;
  class: string;
  overlay: string;
  style: React.CSSProperties;
}

const PRODUCTS: ShowcaseProduct[] = [
  { id: "sneaker", name: "Zapatilla Urbana", src: "/sneaker.png", desc: "Calzado de alta gama" },
  { id: "perfume", name: "Perfume Minimalista", src: "/perfume.png", desc: "Frasco de vidrio premium" },
  { id: "watch", name: "Reloj Inteligente", src: "/watch.png", desc: "Relojería y tecnología" },
];

const BACKGROUNDS: ShowcaseBackground[] = [
  {
    id: "neon",
    name: "Estudio Neón",
    class: "from-violet-950 via-slate-950 to-black text-white",
    overlay: "bg-radial-[at_center_center] from-violet-600/20 via-transparent to-transparent",
    style: { background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(9,9,11,1) 100%)" },
  },
  {
    id: "marble",
    name: "Mármol Premium",
    class: "from-slate-100 via-zinc-100 to-white text-slate-900 border",
    overlay: "bg-gradient-to-b from-white/40 via-transparent to-transparent",
    style: { background: "linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)" },
  },
  {
    id: "wood",
    name: "Madera Rústica",
    class: "from-amber-950 via-stone-900 to-stone-950 text-amber-50",
    overlay: "bg-gradient-to-t from-black/40 via-transparent to-transparent",
    style: { background: "linear-gradient(135deg, #451a03 0%, #1c1917 100%)" },
  },
  {
    id: "foliage",
    name: "Follaje Tropical",
    class: "from-emerald-950 via-zinc-900 to-emerald-950 text-emerald-50",
    overlay: "bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent",
    style: { background: "linear-gradient(135deg, #022c22 0%, #052e16 100%)" },
  },
];

export function AiStudioCanvas() {
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProduct>(PRODUCTS[0]);
  const [selectedBg, setSelectedBg] = useState<ShowcaseBackground>(BACKGROUNDS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Trigger a brief loading state when background changes to simulate AI rendering
  useEffect(() => {
    const renderStart = setTimeout(() => {
      setIsGenerating(true);
    }, 0);
    const renderEnd = setTimeout(() => {
      setIsGenerating(false);
    }, 450);
    return () => {
      clearTimeout(renderStart);
      clearTimeout(renderEnd);
    };
  }, [selectedBg]);

  return (
    <div className="w-full rounded-3xl border border-white bg-white/60 p-6 shadow-2xl shadow-violet-950/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Visual Live Canvas */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
          {/* Canvas Wrapper */}
          <div
            data-testid="ai-canvas-container"
            className={cn(
              "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden transition-all duration-700 ease-in-out p-12"
            )}
            style={selectedBg.style}
          >
            {/* Visual AI effects */}
            <div className={cn("absolute inset-0 transition-opacity duration-700", selectedBg.overlay)} />
            
            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Product Rendering */}
            <div
              className={cn(
                "relative h-64 w-64 transition-all duration-500 ease-out select-none",
                isGenerating ? "scale-90 opacity-20 filter blur-sm" : "scale-100 opacity-100 filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
              )}
            >
              <Image
                src={selectedProduct.src}
                alt={selectedProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-contain"
                priority
              />
            </div>

            {/* Simulated AI scanning beam */}
            {isGenerating && (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_20px_#7c3aed] animate-scan" />
            )}

            {/* AI Status Badge */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur shadow-md">
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                  <span>Generando fondo con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  <span>Resultado listo</span>
                </>
              )}
            </div>
          </div>

          {/* Footer Info of the Canvas */}
          <div className="border-t bg-white/90 p-4 text-xs font-semibold text-muted-foreground flex justify-between items-center dark:bg-zinc-900/90 dark:border-zinc-800">
            <span>Resolución: 1024 x 1024 px (8K PNG)</span>
            <span className="text-violet-600 dark:text-violet-400 uppercase tracking-widest font-black">AI Studio Pro</span>
          </div>
        </div>

        {/* Studio Sidebar Controls */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Title / Description */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Estudio de Fotos</span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Estudio Fotográfico IA</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Probá cómo funciona la generación automática de fondos con Inteligencia Artificial para tus catálogos.
              </p>
            </div>

            {/* Step 1: Select Product */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> 1. Elegí un producto
              </label>
              <div className="grid gap-2">
                {PRODUCTS.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    aria-label={`Seleccionar producto: ${prod.name}`}
                    onClick={() => setSelectedProduct(prod)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.98]",
                      selectedProduct.id === prod.id
                        ? "border-violet-600 bg-violet-50/50 text-slate-900 dark:border-violet-400 dark:bg-violet-950/20 dark:text-white shadow-sm"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">{prod.desc}</p>
                    </div>
                    {selectedProduct.id === prod.id && (
                      <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select IA Background */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> 2. Cambiá el fondo con IA
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    aria-label={`Seleccionar fondo: ${bg.name}`}
                    onClick={() => setSelectedBg(bg)}
                    className={cn(
                      "flex flex-col rounded-xl border p-2.5 text-left transition-all active:scale-[0.98]",
                      selectedBg.id === bg.id
                        ? "border-violet-600 bg-violet-50/50 text-slate-900 dark:border-violet-400 dark:bg-violet-950/20 dark:text-white shadow-sm"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                    )}
                  >
                    {/* Background Preview dot */}
                    <div
                      className="h-6 w-full rounded-md mb-1.5 border border-black/10"
                      style={bg.style}
                    />
                    <span className="text-xs font-bold truncate">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
