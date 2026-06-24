"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signInWithGoogle, login, register, type AuthActionState } from "@/lib/auth/actions";
import { Turnstile } from "./turnstile";
import { ConsentCheckbox } from "@/components/legal/consent-checkbox";

type AuthFormProps = {
  mode?: "customer" | "seller";
  title?: string;
  description?: string;
  submitLabel?: string;
  switchHref?: string;
  switchLabel?: string;
  action?: (formData: FormData) => Promise<AuthActionState>;
  isRegister?: boolean;
  loginAction?: (formData: FormData) => Promise<AuthActionState>;
  registerAction?: (formData: FormData) => Promise<AuthActionState>;
};

export function AuthForm({
  mode = "seller",
  title,
  description,
  submitLabel,
  switchLabel,
  action,
  isRegister,
  loginAction,
  registerAction,
}: AuthFormProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(isRegister ?? false);
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [legalConsent, setLegalConsent] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Synchronize internal state with URL on popstate
  React.useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        setIsRegisterMode(path === "/register");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleToggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const newMode = !isRegisterMode;
    setIsRegisterMode(newMode);
    
    // Clear errors and tokens when toggling mode
    setErrorMsg(null);
    setFieldErrors(null);
    setCaptchaToken(null);
    setLegalConsent(false);

    // Update URL smoothly if window is available
    if (typeof window !== "undefined") {
      const newPath = newMode ? "/register" : "/login";
      window.history.pushState(null, "", newPath);
    }
  };

  const isInitialMode = isRegisterMode === (isRegister ?? false);

  const currentTitle = isInitialMode && title
    ? title
    : isRegisterMode
      ? "Crear cuenta"
      : mode === "customer" ? "Bienvenido de vuelta" : "Ingresar al panel";

  const currentDescription = isInitialMode && description
    ? description
    : isRegisterMode
      ? "Registrate gratis para guardar favoritos, seguir tus pedidos y comprar más rápido."
      : mode === "customer" 
        ? "Iniciá sesión para seguir tus pedidos, guardar favoritos y comprar más rápido."
        : "Accede con tu cuenta registrada para gestionar tu tienda, productos, QR e IA.";

  const currentSubmitLabel = isInitialMode && submitLabel
    ? submitLabel
    : isRegisterMode
      ? "Crear mi cuenta"
      : "Iniciar sesión";

  const currentSwitchLabel = isInitialMode && switchLabel
    ? switchLabel
    : isRegisterMode
      ? "¿Ya tienes cuenta? Inicia sesión"
      : "¿No tienes cuenta? Regístrate";

  const currentAction = isRegisterMode
    ? (registerAction || (isRegister && action) || register)
    : (loginAction || (!isRegister && action) || login);

  const handleGoogleSignIn = () => {
    if (isPending) return;
    const toastId = toast.loading("Redirigiendo a Google...");
    startTransition(async () => {
      try {
        const result = await signInWithGoogle("/auth/callback");
        if (!result.success) {
          toast.error(result.error || "Error al conectar con Google.", { id: toastId });
        } else if (result.data?.url) {
          window.location.href = result.data.url;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Error al conectar con Google.";
        toast.error(errMsg, { id: toastId });
      }
    });
  };

  const stripHtml = (text: string): string => {
    const withoutScripts = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    return withoutScripts.replace(/<\/?[^>]+(>|$)/g, "");
  };

  const handleSubmit = (formData: FormData) => {
    if (isPending) return;
    setErrorMsg(null);
    setFieldErrors(null);
    const toastId = toast.loading("Procesando solicitud...");

    startTransition(async () => {
      try {
        const result = await currentAction(formData);

        if (!result.success) {
          const cleanedError = stripHtml(result.error || "Revisa los campos del formulario.");
          setErrorMsg(cleanedError);
          setFieldErrors(result.fieldErrors || null);
          toast.error(cleanedError, { id: toastId });
          if (passwordRef.current) passwordRef.current.value = "";
          if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
        } else {
          toast.success("¡Operación exitosa!", { id: toastId });
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Error de conexión con el servidor.";
        // Next.js redirect throws an error which starts with NEXT_REDIRECT, we should ignore it as it's not a real error.
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success("¡Ingreso exitoso! Redirigiendo...", { id: toastId });
          return;
        }
        const cleanedError = stripHtml(errMsg);
        setErrorMsg(cleanedError);
        toast.error(cleanedError, { id: toastId });
        if (passwordRef.current) passwordRef.current.value = "";
        if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Left Panel (Emotional/Branding) */}
      <section className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-orange-100 via-orange-50 to-white dark:from-orange-950 dark:via-zinc-900 dark:to-zinc-950 text-slate-900 dark:text-zinc-150 relative overflow-hidden">
        {/* Ambient lighting / background blur glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-300/30 dark:bg-orange-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-300/20 dark:bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Top brand logo */}
        <Link href="/" className="z-10 cursor-pointer group">
          <Logo className="text-3xl group-hover:scale-105 transition-transform" />
        </Link>

        {/* Middle emotional copy */}
        <div className="z-10 my-auto space-y-8 max-w-lg">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight lg:text-5xl text-slate-900 dark:text-white">
              {mode === "customer" ? "Comprá local, comprá fácil." : "Desbloquea tu Potencial."}
            </h2>
            <p className="text-lg text-slate-600 dark:text-zinc-300 font-medium">
              {mode === "customer" 
                ? "Descubrí productos de tiendas ecuatorianas y pedí directo por WhatsApp."
                : "Gestiona, escala y triunfa con IAPI."}
            </p>
          </div>

          {mode === "customer" ? (
            /* Shopping benefits */
            <div className="space-y-4">
              {[
                { icon: "🛍️", title: "Catálogo local", desc: "Explorá productos de tiendas de todo Ecuador" },
                { icon: "❤️", title: "Favoritos", desc: "Guardá tus productos favoritos y volvé cuando quieras" },
                { icon: "📦", title: "Pedí por WhatsApp", desc: "Contacto directo con el vendedor, sin app extra" },
                { icon: "🔔", title: "Seguí tus pedidos", desc: "Recibí notificaciones cuando tu pedido esté listo" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Seller Dashboard Mockup card */
          <div className="rounded-3xl border border-orange-100/80 bg-white/80 dark:border-white/10 dark:bg-white/5 p-6 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">iapi-dashboard.png</span>
            </div>

            {/* Dashboard grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Sales Card */}
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Ventas Totales</p>
                <p className="text-xl font-bold mt-1 text-slate-900 dark:text-white">$12,450.00</p>
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  +15.3%
                </span>
              </div>
              {/* Simple Chart Card */}
              <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Conversión</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">3.24%</p>
                </div>
                {/* Simple bar charts */}
                <div className="flex items-end space-x-1.5 h-8 mt-2">
                  <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-t h-4" />
                  <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-t h-6" />
                  <div className="w-full bg-orange-500 dark:bg-orange-500/80 rounded-t h-8" />
                  <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-t h-5" />
                </div>
              </div>
            </div>

            {/* Weekly Activity simple line simulation */}
            <div className="rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Actividad Semanal</p>
                <span className="text-[10px] text-orange-500 dark:text-orange-400 font-bold">En vivo</span>
              </div>
              <div className="h-10 flex items-end justify-between px-1">
                {/* Visual SVG line */}
                <svg className="w-full h-full text-orange-500/20 dark:text-orange-400/30 overflow-visible" viewBox="0 0 100 30" fill="none" preserveAspectRatio="none">
                  <path d="M0 25 C10 20, 20 5, 30 15 C40 25, 50 10, 60 2 C70 -5, 80 12, 90 8 C100 4, 100 4, 100 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M0 25 C10 20, 20 5, 30 15 C40 25, 50 10, 60 2 C70 -5, 80 12, 90 8 C100 4, 100 4, 100 4 L100 30 L0 30 Z" fill="url(#orange-gradient)" />
                  <defs>
                    <linearGradient id="orange-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer text */}
        <div className="z-10 text-xs text-slate-400 dark:text-zinc-500 font-semibold">
          © {new Date().getFullYear()} Un producto de <a href="https://januscore.pro" target="_blank" rel="noopener noreferrer" className="hover:underline text-orange-500 font-medium">Janus Core</a>. Todos los derechos reservados.
        </div>
      </section>

      {/* Right Panel (Functional Form) */}
      <section className="flex-1 md:w-1/2 flex items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-950">
        <div className="backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 border border-white/20 dark:border-zinc-800/20 shadow-2xl rounded-3xl p-8 max-w-md w-full">
          <div className="mb-8 space-y-2 text-center flex flex-col items-center">
            <Link href="/" className="flex flex-col items-center gap-2 group cursor-pointer">
              <Logo className="text-3xl group-hover:scale-105 transition-transform" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{currentTitle}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{currentDescription}</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            {isRegisterMode && (
              <input type="hidden" name="accepted_legal_terms" value={legalConsent ? "true" : "false"} />
            )}
            <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Email
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-background pl-10 pr-3 text-base outline-none transition focus:border-orange-accent focus:ring-4 focus:ring-orange-accent/10 dark:border-zinc-800 dark:focus:border-orange-accent dark:focus:ring-orange-accent/20 text-slate-900 dark:text-white"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isPending}
                  required
                />
              </div>
              {fieldErrors?.email && (
                <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                  {fieldErrors.email[0]}
                </span>
              )}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Contraseña
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={passwordRef}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-background pl-10 pr-10 text-base outline-none transition focus:border-orange-accent focus:ring-4 focus:ring-orange-accent/10 dark:border-zinc-800 dark:focus:border-orange-accent dark:focus:ring-orange-accent/20 text-slate-900 dark:text-white"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  minLength={6}
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors?.password && (
                <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                  {fieldErrors.password[0]}
                </span>
              )}
            </label>

            {isRegisterMode && (
              <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Confirmar contraseña
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    ref={confirmPasswordRef}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-background pl-10 pr-10 text-base outline-none transition focus:border-orange-accent focus:ring-4 focus:ring-orange-accent/10 dark:border-zinc-800 dark:focus:border-orange-accent dark:focus:ring-orange-accent/20 text-slate-900 dark:text-white"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    disabled={isPending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none flex items-center justify-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors?.confirmPassword && (
                  <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                    {fieldErrors.confirmPassword[0]}
                  </span>
                )}
              </label>
            )}

            {!isRegisterMode && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600 dark:text-zinc-400 font-medium">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-accent focus:ring-orange-accent/20 accent-orange-500"
                  />
                  <span>Recordarme</span>
                </label>
                <Link
                  href="#"
                  className="font-bold text-orange-accent hover:text-orange-accent-hover dark:text-orange-400 dark:hover:text-orange-300 hover:underline underline-offset-4"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            {siteKey && (
              <React.Fragment key={isRegisterMode ? "register" : "login"}>
                <input type="hidden" name="captchaToken" value={captchaToken || ""} />
                <Turnstile siteKey={siteKey} onSuccess={setCaptchaToken} />
              </React.Fragment>
            )}

            {isRegisterMode && (
              <ConsentCheckbox
                checked={legalConsent}
                onChange={setLegalConsent}
                disabled={isPending}
              />
            )}

            <button
              className="h-11 w-full rounded-xl bg-orange-accent hover:bg-orange-accent-hover disabled:bg-orange-accent/50 text-sm font-black text-white transition active:scale-95 shadow-md shadow-orange-accent/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              type="submit"
              disabled={isPending || (!!siteKey && !captchaToken) || (isRegisterMode && !legalConsent)}
            >
              {isPending ? "Procesando..." : currentSubmitLabel}
            </button>
          </form>

          {/* Social Sign-in Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/75 dark:bg-zinc-900/75 px-2 text-muted-foreground font-semibold">
                O continuar con
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              aria-label="Google"
              onClick={handleGoogleSignIn}
              disabled={isPending}
              className="flex w-full justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer text-sm font-semibold text-slate-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={handleToggleMode}
              disabled={isPending}
              className="font-bold text-orange-accent hover:text-orange-accent-hover dark:text-orange-400 dark:hover:text-orange-300 underline-offset-4 hover:underline cursor-pointer bg-transparent border-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentSwitchLabel}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
