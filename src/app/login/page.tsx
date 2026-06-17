import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      mode="customer"
      title="Bienvenido de vuelta"
      description="Iniciá sesión para seguir tus pedidos, guardar favoritos y comprar más rápido."
      submitLabel="Iniciar sesión"
      switchHref="/register"
      switchLabel="¿No tienes cuenta? Registrate gratis"
      action={login}
    />
  );
}
