import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/lib/auth/actions";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <AuthForm
        mode="customer"
        title="Bienvenido de vuelta"
        description="Iniciá sesión para seguir tus pedidos, guardar favoritos y comprar más rápido."
        submitLabel="Iniciar sesión"
        switchHref="/register"
        switchLabel="¿No tienes cuenta? Registrate gratis"
        action={login}
      />
    </Suspense>
  );
}
