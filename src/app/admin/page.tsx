import { redirect } from "next/navigation";

import { getUserRoleInfo } from "@/lib/auth/actions";
import pkg from "../../../package.json";

export default async function AdminPage() {
  const res = await getUserRoleInfo();
  const email = res.data?.email || null;
  const role = res.data?.platformRole || null;

  if (role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-muted px-6 py-8">
      <section className="mx-auto max-w-5xl rounded-3xl border bg-background p-6 shadow-sm">
        <p className="text-sm font-bold text-orange-500">Admin global</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Panel administrativo <span className="text-orange-500">IAPI</span>
          <span className="text-orange-400 text-sm font-black tracking-[0.2em] uppercase ml-1">shop</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {email} tiene rol <strong>{role}</strong>. Este acceso bootstrap será migrado a `platform_admins` con RLS.
        </p>

        <div className="mt-8 flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
          <span>IAPI Shop © {new Date().getFullYear()}</span>
          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 text-[10px] font-bold">v{pkg.version}</span>
        </div>
      </section>
    </main>
  );
}
