"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const authSchema = z.object({
  email: z.string().trim().email("Ingresa un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export async function login(formData: FormData): Promise<AuthActionState> {
  const parsed = parseAuthForm(formData);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: "No pudimos iniciar sesión. Revisa tus credenciales." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData): Promise<AuthActionState> {
  const parsed = parseAuthForm(formData);

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    return { ok: false, message: "No pudimos crear tu cuenta. Intenta con otro email." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function parseAuthForm(formData: FormData) {
  return authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function validationError(fieldErrors: Record<string, string[] | undefined>): AuthActionState {
  return {
    ok: false,
    message: "Revisa los campos del formulario.",
    fieldErrors: Object.fromEntries(Object.entries(fieldErrors).filter(([, value]) => value?.length)) as Record<string, string[]>,
  };
}

export interface UserRoleInfo {
  email: string;
  platformRole: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getUserRoleInfo(): Promise<ActionResult<UserRoleInfo>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) return { success: false, error: error.message };

    const email = typeof data?.claims?.email === "string" ? data.claims.email : "Usuario registrado";
    const platformRole = (data?.claims?.email as string)?.endsWith("@iapi.shop") ? "admin" : "merchant";

    return {
      success: true,
      data: { email, platformRole }
    };
  } catch (error) {
    console.error("getUserRoleInfo Error:", error);
    return { success: false, error: "Error al obtener rol del usuario" };
  }
}
