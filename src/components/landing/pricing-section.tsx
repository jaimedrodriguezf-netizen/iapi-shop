"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  desc: string;
  price: number | string;
  period: string;
  features: PricingFeature[];
  buttonText: string;
  popular: boolean;
  comingSoon?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "Gratis",
    desc: "Para emprendedores individuales y tiendas iniciales.",
    price: 0,
    period: "/ año",
    features: [
      { text: "Hasta 25 productos activos", included: true },
      { text: "Catálogo digital QR básico", included: true },
      { text: "1 foto por producto", included: true },
      { text: "Pedidos directos por WhatsApp", included: true },
      { text: "Soporte por comunidad", included: true },
      { text: "Pasarela PayPal Ecuador", included: false },
      { text: "Dominio personalizado y sucursales", included: false },
    ],
    buttonText: "Comenzar Gratis",
    popular: false,
  },
  {
    name: "Plus",
    desc: "Ideal para negocios y tiendas locales en crecimiento.",
    price: 49.99,
    period: "/ año",
    features: [
      { text: "Todo lo del Plan Gratis", included: true },
      { text: "Hasta 300 productos activos", included: true },
      { text: "Hasta 3 fotos por producto", included: true },
      { text: "Descarga de QR en alta resolución", included: true },
      { text: "Estudio básico de fondos con IA", included: true },
      { text: "Soporte técnico por email", included: true },
      { text: "Pasarela PayPal Ecuador", included: false },
    ],
    buttonText: "Elegir Plan Plus",
    popular: true,
  },
  {
    name: "Pro",
    desc: "Para comercios consolidados y multi-sucursales.",
    price: "Próximamente",
    period: "",
    features: [
      { text: "Todo lo del Plan Plus", included: true },
      { text: "Hasta 2000 productos activos", included: true },
      { text: "Hasta 6 fotos por producto", included: true },
      { text: "Integración de PayPal Ecuador", included: true },
      { text: "Dominio personalizado", included: true },
      { text: "Gestión de sucursales y empleados", included: true },
      { text: "Soporte prioritario 24/7", included: true },
    ],
    buttonText: "Próximamente",
    popular: false,
    comingSoon: true,
  },
];

export function PricingSection() {

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
          <div className="flex items-center justify-center pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-accent/10 px-3 py-1 text-xs font-bold text-violet-accent border border-violet-accent/20 dark:bg-violet-950/40 dark:text-violet-350">
              Solo facturación anual disponible
            </span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {PLANS.map((plan) => {
            return (
              <div
                key={plan.name}
                className={cn(
                  "rounded-3xl border p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 hover:shadow-xl",
                  plan.popular
                    ? "border-violet-accent bg-gradient-to-b from-violet-accent/5 to-white dark:from-violet-accent/10 dark:to-zinc-900 shadow-lg md:scale-105 z-10"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-accent text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-md">
                    Más Popular
                  </span>
                )}

                <div>
                  {/* Plan Name */}
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground min-h-[36px] leading-relaxed mb-6">{plan.desc}</p>

                  {/* Price */}
                  <div className="flex flex-col justify-end gap-1 mb-8 min-h-[52px]">
                    <div className="flex items-baseline gap-1">
                      {typeof plan.price === "number" ? (
                        <>
                          <span className="text-4xl font-black text-slate-950 dark:text-white tabular-nums">${plan.price}</span>
                          <span className="text-xs font-semibold text-muted-foreground">{plan.period}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-slate-950 dark:text-white">{plan.price}</span>
                      )}
                    </div>
                    {plan.name === "Plus" && (
                      <span className="text-[10px] font-bold text-violet-accent">IVA incluido</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 mb-8" />

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat.text} className="flex items-start gap-3 text-sm">
                        {feat.included ? (
                          <Check className="h-5 w-5 text-violet-accent shrink-0" />
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
                  disabled={plan.comingSoon}
                  className={cn(
                    "w-full rounded-xl py-4 text-center text-sm font-black transition-all shadow-sm",
                    plan.comingSoon
                      ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
                      : plan.popular
                        ? "bg-violet-accent hover:bg-violet-accent-hover text-white hover:shadow-md cursor-pointer active:scale-[0.98]"
                        : "border border-zinc-200 bg-white hover:bg-zinc-50 text-slate-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white cursor-pointer active:scale-[0.98]"
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
