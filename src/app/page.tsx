import Link from "next/link";

const benefits = [
  "QR por tienda para compartir catálogo privado",
  "WhatsApp, PayPal Ecuador y transferencia manual",
  "Fotos de producto con fondos generados por IA",
  "Roles, permisos y RLS para proteger los datos",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_34%),linear-gradient(135deg,#fff,#f8fafc)] text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <p className="text-lg font-black tracking-tight">Mercado QR</p>
          <nav aria-label="Navegación pública" className="flex items-center gap-3 text-sm font-semibold">
            <Link className="rounded-full px-4 py-2 text-slate-700 hover:bg-white" href="/vendedores">
              Vendedores
            </Link>
            <Link className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-900 shadow-sm" href="/login">
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700">
              Plataforma segura para tiendas ecuatorianas
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Vende con QR, WhatsApp e IA sin exponer tus datos.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Crea una tienda privada con roles, suscripciones, pagos locales e imágenes profesionales para tus productos. Los visitantes anónimos solo ven esta landing pública.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800" href="/register">
                Crear mi tienda
              </Link>
              <Link className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-bold text-slate-900 hover:bg-slate-50" href="/login">
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-2xl shadow-orange-950/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-slate-950">MVP</span>
                <span className="text-xs text-slate-300">Dashboard privado</span>
              </div>
              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="rounded-2xl bg-white/10 p-4 text-sm font-semibold text-slate-100">
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
