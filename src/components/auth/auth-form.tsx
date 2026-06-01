"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { AuthActionState } from "@/lib/auth/actions";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  switchHref: string;
  switchLabel: string;
  action: (formData: FormData) => Promise<AuthActionState>;
  isRegister?: boolean;
};

export function AuthForm({ title, description, submitLabel, switchHref, switchLabel, action, isRegister }: AuthFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null);
    setFieldErrors(null);
    const toastId = toast.loading("Procesando solicitud...");

    startTransition(async () => {
      try {
        const result = await action(formData);

        if (!result.success) {
          setErrorMsg(result.error || "Revisa los campos del formulario.");
          setFieldErrors(result.fieldErrors || null);
          toast.error(result.error || "Error al procesar la solicitud.", { id: toastId });
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
        setErrorMsg(errMsg);
        toast.error(errMsg, { id: toastId });
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border bg-background p-8 shadow-xl shadow-slate-950/5">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-bold text-violet-accent">IAPI Shop</p>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <form action={handleSubmit} className="space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Email
            <input
              className="h-11 rounded-xl border border-zinc-200 bg-background px-3 text-base outline-none transition focus:border-violet-accent focus:ring-4 focus:ring-violet-accent/10 dark:border-zinc-800 dark:focus:border-violet-accent dark:focus:ring-violet-accent/20 text-slate-900 dark:text-white"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              required
            />
            {fieldErrors?.email && (
              <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                {fieldErrors.email[0]}
              </span>
            )}
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
            Contraseña
            <input
              className="h-11 rounded-xl border border-zinc-200 bg-background px-3 text-base outline-none transition focus:border-violet-accent focus:ring-4 focus:ring-violet-accent/10 dark:border-zinc-800 dark:focus:border-violet-accent dark:focus:ring-violet-accent/20 text-slate-900 dark:text-white"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              disabled={isPending}
              required
            />
            {fieldErrors?.password && (
              <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                {fieldErrors.password[0]}
              </span>
            )}
          </label>

          {isRegister && (
            <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Confirmar contraseña
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-background px-3 text-base outline-none transition focus:border-violet-accent focus:ring-4 focus:ring-violet-accent/10 dark:border-zinc-800 dark:focus:border-violet-accent dark:focus:ring-violet-accent/20 text-slate-900 dark:text-white"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                disabled={isPending}
                required
              />
              {fieldErrors?.confirmPassword && (
                <span className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-0.5 animate-in fade-in duration-200">
                  {fieldErrors.confirmPassword[0]}
                </span>
              )}
            </label>
          )}

          <button
            className="h-11 w-full rounded-xl bg-violet-accent hover:bg-violet-accent-hover disabled:bg-violet-accent/50 text-sm font-black text-white transition active:scale-95 shadow-md shadow-violet-accent/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Procesando..." : submitLabel}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-bold text-violet-accent hover:text-violet-accent-hover dark:text-violet-400 dark:hover:text-violet-300 underline-offset-4 hover:underline" href={switchHref}>
            {switchLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
