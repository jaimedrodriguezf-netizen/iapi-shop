import Link from "next/link";

export interface UsageLimitsWidgetProps {
  currentProducts: number;
  productLimit: number;
  currentShops: number;
  shopLimit?: number;
}

export function UsageLimitsWidget({
  currentProducts,
  productLimit,
  currentShops,
  shopLimit = 1,
}: UsageLimitsWidgetProps) {
  const productPercentage = Math.min((currentProducts / productLimit) * 100, 100);
  const shopPercentage = Math.min((currentShops / shopLimit) * 100, 100);
  const reachedProductLimit = currentProducts >= productLimit;

  return (
    <div className="rounded-3xl border bg-background p-6 shadow-sm space-y-6">
      <h3 className="font-black text-lg">Límites de Uso</h3>
      
      <div className="space-y-4">
        {/* Productos Limit */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Productos</span>
            <span className="font-bold">{currentProducts} / {productLimit}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                reachedProductLimit ? "bg-amber-500" : "bg-orange-500"
              }`}
              style={{ width: `${productPercentage}%` }}
              data-testid="product-progress-bar"
            />
          </div>
        </div>

        {/* Sucursales Limit */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Sucursales</span>
            <span className="font-bold">{currentShops} / {shopLimit}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${shopPercentage}%` }}
              data-testid="shop-progress-bar"
            />
          </div>
        </div>
      </div>

      {reachedProductLimit && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 dark:bg-amber-950/20 dark:border-amber-900/30">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⚠️ Has alcanzado el límite de productos. Actualiza tu plan para seguir agregando más.
          </p>
          <Link
            href="/#pricing-title"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            Mejorar Plan
          </Link>
        </div>
      )}
    </div>
  );
}

export interface OnboardingChecklistWidgetProps {
  storeName?: string;
  storeSlug?: string;
  whatsappPhone?: string;
  productCount: number;
}

export function OnboardingChecklistWidget({
  storeName = "",
  storeSlug = "",
  whatsappPhone = "",
  productCount,
}: OnboardingChecklistWidgetProps) {
  const isNameCustomized = storeName !== "Mi Tienda";
  const isUrlCustomized = !!storeSlug && !storeSlug.startsWith("tienda-");
  const isWhatsappConfigured = !!whatsappPhone && whatsappPhone.trim() !== "";
  const hasProducts = productCount > 0;

  const tasks = [
    { label: "Personalizar nombre de la tienda", completed: isNameCustomized },
    { label: "Personalizar URL de la tienda", completed: isUrlCustomized },
    { label: "Configurar número de WhatsApp", completed: isWhatsappConfigured },
    { label: "Agregar al menos un producto", completed: hasProducts },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPercentage = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="rounded-3xl border bg-background p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-black text-lg">Pasos Iniciales</h3>
        <p className="text-sm text-muted-foreground mt-1">Completa estos pasos para configurar tu tienda.</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm font-bold">
          <span>Progreso</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
            data-testid="onboarding-progress-bar"
          />
        </div>
      </div>

      <ul className="space-y-3">
        {tasks.map((task, idx) => (
          <li key={idx} className="flex items-center space-x-3 text-sm">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              task.completed
                ? "bg-green-50 border-green-500 text-green-600 dark:bg-green-950/20"
                : "border-slate-300 text-transparent"
            }`}>
              {task.completed && (
                <svg
                  className="h-3.5 w-3.5 stroke-[3]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span className={task.completed ? "text-slate-500 line-through" : "font-medium text-slate-800 dark:text-slate-200"}>
              {task.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/settings"
        className="inline-flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors shadow-sm"
      >
        Completar →
      </Link>
    </div>
  );
}

export function PremiumBenefitsWidget() {
  const benefits = [
    "Catálogo público sin restricciones",
    "Estadísticas detalladas de ventas y rendimiento",
    "Hasta 300 productos activos",
    "Hasta 3 fotos por producto",
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-6 text-white shadow-md">
      {/* Decorative backdrop glow */}
      <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />

      <div className="relative space-y-6">
        <div>
          <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            👑 PLAN PLUS
          </span>
          <h3 className="mt-3 text-2xl font-black tracking-tight">Desbloquea el Potencial</h3>
          <p className="mt-1 text-sm text-orange-100">
            Mejora al Plan Plus para impulsar tus ventas locales:
          </p>
        </div>

        <ul className="space-y-3">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <span className="font-medium">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <Link
            href="/#pricing-title"
            className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors shadow-lg"
          >
            Obtener Plan Plus
          </Link>
        </div>
      </div>
    </div>
  );
}
