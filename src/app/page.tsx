import Link from "next/link";
import { AiStudioCanvas } from "@/components/landing/ai-studio-canvas";
import { PricingSection } from "@/components/landing/pricing-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f5f3ff,transparent_34%),linear-gradient(135deg,#fff,#f8fafc)] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <p className="text-lg font-black tracking-tight">Mercado QR</p>
          <nav aria-label="Navegación pública" className="flex items-center gap-3 text-sm font-semibold">
            <Link className="rounded-xl px-4 py-2 text-slate-700 hover:bg-white" href="/vendedores">
              Vendedores
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm" href="/login">
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <div className="grid items-center gap-12 py-12 px-8 lg:grid-cols-[1.05fr_0.95fr] rounded-3xl border border-zinc-200/80 bg-white/40 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-950/40 backdrop-blur my-8">
          <div className="space-y-8">
            <div className="inline-flex rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
              Plataforma segura para tiendas ecuatorianas
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl text-balance">
                Vende con QR, WhatsApp e IA sin exponer tus datos.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 font-medium">
                Crea una tienda privada con roles, suscripciones, pagos locales e imágenes profesionales para tus productos. Los visitantes anónimos solo ven esta landing pública.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-xl bg-slate-950 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800" href="/register">
                Crear mi tienda
              </Link>
              <Link className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 hover:bg-slate-50" href="/login">
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <AiStudioCanvas />
          </div>
        </div>

        {/* Pricing plans section */}
        <PricingSection />
      </section>
    </main>
  );
}
