import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <AuthForm
      title="Ingresar al panel"
      description="Accede con tu cuenta registrada para gestionar tu tienda, productos, QR e IA."
      submitLabel="Iniciar sesión"
      switchHref="/register"
      switchLabel="Crear una cuenta de tienda"
      action={login}
    />
  );
}
