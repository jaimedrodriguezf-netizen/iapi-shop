import { AuthForm } from "@/components/auth/auth-form";
import { register } from "@/lib/auth/actions";

export default function RegisterPage() {
  return (
    <AuthForm
      mode="customer"
      title="Crear cuenta gratis"
      description="Registrate para guardar favoritos, seguir tus pedidos y comprar más rápido en tiendas locales."
      submitLabel="Crear mi cuenta"
      switchHref="/login"
      switchLabel="¿Ya tienes cuenta? Inicia sesión"
      action={register}
      isRegister
    />
  );
}
