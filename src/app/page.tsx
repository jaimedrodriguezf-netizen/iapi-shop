import Link from "next/link";
import { StorefrontMotionCanvas } from "@/components/landing/storefront-motion-canvas";
import { PricingSection } from "@/components/landing/pricing-section";
import { Sparkles, Shield, QrCode } from "lucide-react";
import pkg from "../../package.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f3ff,transparent_34%),linear-gradient(135deg,#fff,#f8fafc)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,#1e1b4b,transparent_34%),linear-gradient(135deg,#09090b,#030712)] dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between">
          <p className="text-lg font-black tracking-tight flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <QrCode className="h-5 w-5" /> Mercado QR
          </p>
          <nav aria-label="Navegación pública" className="flex items-center gap-3 text-sm font-semibold">
            <Link className="rounded-xl px-4 py-2 text-slate-750 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900" href="/vendedores">
              Vendedores
            </Link>
            <Link className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white" href="/login">
              Iniciar sesión
            </Link>
          </nav>
        </header>

        {/* Hero Container Section - rounded-3xl following guidelines */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white/40 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-950/40 backdrop-blur-xl p-8 md:p-12 my-8 space-y-12">
          
          {/* Centered Hero Content */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-2 text-xs font-bold text-violet-750 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-400">
              <Shield className="h-3.5 w-3.5" /> Plataforma segura para tiendas ecuatorianas
            </div>
            
            <h1 className="text-5xl font-black leading-[0.95] tracking-tighter sm:text-6xl text-balance text-slate-900 dark:text-white">
              Vende con QR y WhatsApp sin exponer tus datos.
            </h1>
            
            <p className="text-lg leading-8 text-slate-655 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
              Crea catálogos privados interactivos con roles, suscripciones en línea y pasarelas locales seguras. Tus clientes compran y te llega el pedido estructurado al instante.
            </p>
            
            <div className="flex flex-col gap-3 sm:flex-row justify-center pt-2">
              <Link className="rounded-xl bg-violet-650 hover:bg-violet-700 text-center text-sm font-black text-white px-8 py-4 shadow-lg shadow-violet-550/20 active:scale-95 transition-all" href="/register">
                Crear mi tienda gratis
              </Link>
              <Link className="rounded-xl border border-zinc-200 bg-white px-8 py-4 text-center text-sm font-black text-slate-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-950" href="/login">
                Explorar Demo
              </Link>
            </div>
          </div>

          {/* Interactive Motion Canvas Block */}
          <div className="pt-6">
            <div className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 mb-4 px-4">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Actividad Comercial en Tiempo Real</span>
            </div>
            <StorefrontMotionCanvas />
          </div>

        </div>

        {/* E-commerce Pricing Section */}
        <PricingSection />

        {/* Footer with copyright and version */}
        <footer className="mt-16 border-t pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground dark:border-zinc-800/80">
          <p>© 2026 Mercado QR. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/terminos">Términos y condiciones</Link>
            <Link className="hover:text-slate-900 dark:hover:text-white" href="/privacidad">Privacidad</Link>
            <span className="bg-zinc-150 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-xl font-bold tabular-nums">
              v{pkg.version}
            </span>
          </div>
        </footer>

      </section>
    </main>
  );
}
