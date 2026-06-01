"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  desc: string;
  priceMonthly: number;
  priceAnnually: number;
  features: PricingFeature[];
  buttonText: string;
  popular: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "Gratis",
    desc: "Para emprendedores individuales y tiendas iniciales.",
    priceMonthly: 0,
    priceAnnually: 0,
    features: [
      { text: "Catálogo digital QR básico", included: true },
      { text: "Hasta 15 productos activos", included: true },
      { text: "Pedidos directos por WhatsApp", included: true },
      { text: "Soporte por comunidad", included: true },
      { text: "Pasarela PayPal Ecuador", included: false },
      { text: "Dominio personalizado y sucursales", included: false },
    ],
    buttonText: "Comenzar Gratis",
    popular: false,
  },
  {
    name: "Standard",
    desc: "Ideal para negocios y tiendas locales en crecimiento.",
    priceMonthly: 29,
    priceAnnually: 23,
    features: [
      { text: "Todo lo del Plan Gratis", included: true },
      { text: "Productos y catálogos ilimitados", included: true },
      { text: "Descarga de QR en alta resolución", included: true },
      { text: "Estudio básico de fondos con IA", included: true },
      { text: "Soporte técnico por email", included: true },
      { text: "Pasarela PayPal Ecuador", included: false },
      { text: "Dominio personalizado y sucursales", included: false },
    ],
    buttonText: "Elegir Plan Standard",
    popular: true,
  },
  {
    name: "Business",
    desc: "Para comercios consolidados y multi-sucursales.",
    priceMonthly: 79,
    priceAnnually: 63,
    features: [
      { text: "Todo lo del Plan Standard", included: true },
      { text: "Integración de PayPal Ecuador", included: true },
      { text: "Dominio personalizado", included: true },
      { text: "Gestión de sucursales y empleados", included: true },
      { text: "Personalización completa de marca", included: true },
      { text: "Soporte prioritario 24/7", included: true },
    ],
    buttonText: "Elegir Plan Business",
    popular: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="py-24" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 id="pricing-title" className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white text-balance">
            Planes a la medida de tu comercio
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Elegí la opción ideal para digitalizar tus ventas. Cambiá de plan cuando quieras.
          </p>

          {/* Billing Switch Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={cn("text-sm font-semibold transition-colors", !isAnnual ? "text-slate-900 dark:text-white" : "text-muted-foreground")}>
              Mensual
            </span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                aria-label="Facturación anual"
                checked={isAnnual}
                onChange={(e) => setIsAnnual(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-zinc-200 peer-focus:outline-none dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
            <span className={cn("text-sm font-semibold transition-colors flex items-center gap-1.5", isAnnual ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground")}>
              Anual
              <span className="bg-violet-100 text-violet-700 text-[10px] font-black px-2 py-0.5 rounded-xl dark:bg-violet-950/40 dark:text-violet-300">
                Ahorrá 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {PLANS.map((plan) => {
            const price = isAnnual ? plan.priceAnnually : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={cn(
                  "rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 hover:shadow-xl",
                  plan.popular
                    ? "border-violet-500 bg-gradient-to-b from-violet-50/30 to-white dark:from-violet-950/10 dark:to-zinc-900 shadow-lg md:scale-105 z-10"
                    : "border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-md">
                    Más Popular
                  </span>
                )}

                <div>
                  {/* Plan Name */}
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground min-h-[36px] leading-relaxed mb-6">{plan.desc}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-slate-950 dark:text-white tabular-nums">${price}</span>
                    <span className="text-xs font-semibold text-muted-foreground">/ mes</span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-8" />

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat.text} className="flex items-start gap-3 text-sm">
                        {feat.included ? (
                          <Check className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                        )}
                        <span className={cn(feat.included ? "text-slate-700 dark:text-zinc-300" : "text-muted-foreground line-through opacity-50")}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-xl py-4 text-center text-sm font-black transition-all active:scale-[0.98] cursor-pointer shadow-sm",
                    plan.popular
                      ? "bg-violet-600 hover:bg-violet-700 text-white hover:shadow-md"
                      : "border border-zinc-200 bg-white hover:bg-zinc-50 text-slate-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  )}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
