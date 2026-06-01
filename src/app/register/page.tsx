import { AuthForm } from "@/components/auth/auth-form";
import { register } from "@/lib/auth/actions";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Crear cuenta"
      description="Registra tu acceso para empezar a configurar tu tienda privada en IAPI Shop."
      submitLabel="Crear mi cuenta"
      switchHref="/login"
      switchLabel="¿Ya tienes cuenta? Inicia sesión"
      action={register}
      isRegister
    />
  );
}
