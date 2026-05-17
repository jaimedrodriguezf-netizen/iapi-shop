import Link from "next/link";

import type { AuthActionState } from "@/lib/auth/actions";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  switchHref: string;
  switchLabel: string;
  action: (formData: FormData) => Promise<AuthActionState | void>;
};

export function AuthForm({ title, description, submitLabel, switchHref, switchLabel, action }: AuthFormProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border bg-background p-8 shadow-xl shadow-slate-950/5">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-sm font-bold text-orange-600">IAPI Shop</p>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        <form action={action as (formData: FormData) => Promise<void>} className="space-y-5">
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input
              className="h-11 rounded-xl border bg-background px-3 text-base outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Contraseña
            <input
              className="h-11 rounded-xl border bg-background px-3 text-base outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
            />
          </label>

          <button className="h-11 w-full rounded-xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800" type="submit">
            {submitLabel}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-bold text-slate-950 underline-offset-4 hover:underline" href={switchHref}>
            {switchLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
