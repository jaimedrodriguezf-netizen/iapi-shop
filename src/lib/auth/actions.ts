"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { authRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { isBootstrapPlatformAdminEmail, isPlatformAdmin } from "./platform-admins";
import { getSiteOrigin, isSafeRedirect } from "./url-utils";
import { createNotification } from "@/lib/notifications/actions";

export type AuthActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const authSchema = z.object({
  email: z.string().trim().email("Ingresa un email válido.").max(255, "El email no puede tener más de 255 caracteres."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña no puede tener más de 72 caracteres.")
    .regex(/[0-9!@#$%^&*(),.?":{}|<>]/, "La contraseña debe incluir al menos un número o carácter especial."),
});

const registerSchema = z
  .object({
    email: z.string().trim().email("Ingresa un email válido.").max(255, "El email no puede tener más de 255 caracteres."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña no puede tener más de 72 caracteres.")
      .regex(/[0-9!@#$%^&*(),.?":{}|<>]/, "La contraseña debe incluir al menos un número o carácter especial."),
    confirmPassword: z.string().min(8, "La confirmación es requerida."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export async function login(formData: FormData): Promise<AuthActionState> {
  try {
    const parsed = parseAuthForm(formData);

    if (!parsed.success) {
      return validationError(parsed.error.flatten().fieldErrors);
    }

    // Rate limiting
    const clientIp = await getClientIdentifier();
    const { success: rateLimitOk } = await authRateLimit.limit(clientIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiados intentos. Intenta de nuevo en unos minutos." };
    }

    const captchaToken = formData.get("captchaToken") as string | null;
    const supabase = await createClient();
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken: captchaToken || undefined,
      },
    });

    if (error) {
      return { success: false, error: "No pudimos iniciar sesión. Revisa tus credenciales." };
    }

    revalidatePath("/", "layout");

    // Always redirect to the main marketplace after login
    redirect("/");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado.";
    if (errorMsg.includes("NEXT_REDIRECT")) throw err;
    return { success: false, error: errorMsg };
  }
}

export async function register(formData: FormData): Promise<AuthActionState> {
  try {
    // Validate legal terms acceptance
    const acceptedLegalTerms = formData.get("accepted_legal_terms");
    if (acceptedLegalTerms !== "true") {
      return { success: false, error: "Debes aceptar los términos y condiciones y la política de privacidad." };
    }

    const parsed = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return validationError(parsed.error.flatten().fieldErrors);
    }

    // Rate limiting
    const clientIp = await getClientIdentifier();
    const { success: rateLimitOk } = await authRateLimit.limit(clientIp);
    if (!rateLimitOk) {
      return { success: false, error: "Demasiados intentos. Intenta de nuevo en unos minutos." };
    }

    const captchaToken = formData.get("captchaToken") as string | null;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        captchaToken: captchaToken || undefined,
      },
    });

    if (error) {
      return { success: false, error: "No pudimos crear tu cuenta. Intenta con otro email." };
    }

    // Notify platform admins about new user
    try {
      const supabaseForNotify = await createClient();
      const { data: admins } = await supabaseForNotify
        .from("platform_admins")
        .select("user_id");
      
      if (admins) {
        for (const admin of admins) {
          await createNotification(
            admin.user_id,
            "new_user",
            `Nuevo usuario registrado`,
            `${parsed.data.email} se registró en Tenddy Shop`,
            "/dashboard/admin/users"
          );
        }
      }
    } catch (e) {
      console.error("Failed to notify admins about new user:", e);
    }

    // Redirect to login with confirmation message if email verification is required
    if (data?.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
      revalidatePath("/", "layout");
      redirect("/login?message=check-email");
    }

    // New registered users never have tenants yet — send to profile
    revalidatePath("/", "layout");
    redirect("/perfil");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado.";
    if (errorMsg.includes("NEXT_REDIRECT")) throw err;
    return { success: false, error: errorMsg };
  }
}

export async function logout(): Promise<AuthActionState> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado.";
    if (errorMsg.includes("NEXT_REDIRECT")) throw err;
    return { success: false, error: errorMsg };
  }
}

/**
 * Thin wrapper for use as a Next.js form action (returns void).
 * logout() returns AuthActionState, which is incompatible with form action types.
 */
export async function logoutAction(): Promise<void> {
  await logout();
}

/**
 * Logout and redirect to the main landing page (not login).
 * Used by the marketplace header profile popover.
 */
export async function logoutToLanding(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  } catch (err: unknown) {
    console.error("logoutToLanding:", err);
  }
  // Client handles redirect to "/"
}

function parseAuthForm(formData: FormData) {
  return authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function validationError(fieldErrors: Record<string, string[] | undefined>): AuthActionState {
  return {
    success: false,
    error: "Revisa los campos del formulario.",
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { success: false, error: "No autorizado" };

    const email = user.email || "";
    const isAdmin = await isPlatformAdmin(user.id, email);
    const platformRole = isAdmin ? "admin" : "merchant";

    return {
      success: true,
      data: { email, platformRole }
    };
  } catch (err: unknown) {
    console.error("getUserRoleInfo Error:", err);
    return { success: false, error: "Error al obtener rol del usuario" };
  }
}

export async function signInWithGoogle(redirectTo: string): Promise<ActionResult<{ url: string }>> {
  if (!isSafeRedirect(redirectTo)) {
    return { success: false, error: "URL de redirección inválida." };
  }

  try {
    const origin = await getSiteOrigin();
    const fullRedirectUrl = `${origin}${redirectTo}`;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: fullRedirectUrl,
      },
    });

    if (error) {
      console.error("signInWithGoogle:", error);
      return { success: false, error: "Error al procesar la solicitud" };
    }

    if (data?.url) {
      return { success: true, data: { url: data.url } };
    }

    return { success: false, error: "No se pudo obtener la URL de inicio de sesión con Google." };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error inesperado.";
    return { success: false, error: errorMsg };
  }
}
