import { redirect } from "next/navigation";

import { getUserRoleInfo } from "@/lib/auth/actions";

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
        <p className="text-sm font-bold text-violet-600">Admin global</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Panel administrativo IAPI Shop</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {email} tiene rol <strong>{role}</strong>. Este acceso bootstrap será migrado a `platform_admins` con RLS.
        </p>
      </section>
    </main>
  );
}
