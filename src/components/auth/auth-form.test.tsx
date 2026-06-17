import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";
import { toast } from "sonner";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "mock-toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AuthForm Component - Edge Cases and UX/UI States", () => {
  const mockAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAction.mockReset();
  });

  it("renders the login form correctly with all key fields and labels", () => {
    render(
      <AuthForm
        title="Ingresar al panel"
        description="Accede para gestionar tu tienda"
        submitLabel="Iniciar sesión"
        switchHref="/register"
        switchLabel="¿No tienes cuenta? Regístrate"
        action={mockAction}
      />
    );

    expect(screen.getByRole("heading", { name: /ingresar al panel/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();

    // Verify premium visual layout components
    expect(screen.getByText("Desbloquea tu Potencial.")).toBeInTheDocument();
    expect(screen.getByText("Gestiona, escala y triunfa con IAPI.")).toBeInTheDocument();
    expect(screen.getByLabelText("Recordarme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
  });

  it("disables all inputs and submit button when the form submission is pending", async () => {
    const user = userEvent.setup();
    // Simulate a slow action to test pending state
    let resolveAction!: (value: unknown) => void;
    const actionPromise = new Promise((resolve) => {
      resolveAction = resolve;
    });
    mockAction.mockReturnValueOnce(actionPromise);

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    // Inputs and buttons must be disabled during transition
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent("Procesando...");

    // Resolve the promise
    resolveAction({ success: true });
    
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it("displays field-specific validation errors returned by the server action", async () => {
    const user = userEvent.setup();
    mockAction.mockResolvedValueOnce({
      success: false,
      error: "Revisa los campos del formulario.",
      fieldErrors: {
        email: ["Ingresa un email válido."],
        password: ["La contraseña debe tener al menos 6 caracteres."],
      },
    });

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "invalid@example.com");
    await user.type(passwordInput, "123456");
    await user.click(submitBtn);

    // Verify errors are displayed on screen
    await waitFor(() => {
      expect(screen.getByText("Ingresa un email válido.")).toBeInTheDocument();
      expect(screen.getByText("La contraseña debe tener al menos 6 caracteres.")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Revisa los campos del formulario.", { id: "mock-toast-id" });
    });
  });

  it("handles NEXT_REDIRECT exception as a success state without crashing", async () => {
    const user = userEvent.setup();
    // Next.js redirection throws an error starting with NEXT_REDIRECT
    mockAction.mockRejectedValueOnce(new Error("NEXT_REDIRECT:/dashboard"));

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("¡Ingreso exitoso! Redirigiendo...", { id: "mock-toast-id" });
    });
  });

  it("handles unexpected network / server errors gracefully", async () => {
    const user = userEvent.setup();
    mockAction.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("Network Error", { id: "mock-toast-id" });
    });
  });

  it("toggles the password field visibility when eye icon button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
    const toggleBtn = screen.getByRole("button", { name: "" }); // the eye button has no name text, but it's the only button inside the relative container

    expect(passwordInput.type).toBe("password");

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("ignores subsequent submissions if a submission is already pending", async () => {
    const user = userEvent.setup();
    // Simulate slow action
    const actionPromise = new Promise(() => {});
    mockAction.mockReturnValueOnce(actionPromise);

    const { container } = render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "password123");

    // Dispatch submit twice directly on the form
    const form = container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    // mockAction should only have been called once!
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it("strips HTML and script tags from the error message before displaying it", async () => {
    const user = userEvent.setup();
    mockAction.mockResolvedValueOnce({
      success: false,
      error: "Error: <script>alert('xss')</script>Intentelo <b>más</b> tarde.",
    });

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    await waitFor(() => {
      // The text shown should not contain HTML tags
      const errorDiv = screen.getByText("Error: Intentelo más tarde.");
      expect(errorDiv).toBeInTheDocument();
      // Ensure the raw HTML string is not rendered as HTML
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    });
  });

  it("clears the password input field when the authentication fails", async () => {
    const user = userEvent.setup();
    mockAction.mockResolvedValueOnce({
      success: false,
      error: "Credenciales incorrectas.",
    });

    render(
      <AuthForm
        title="Ingresar"
        description="Accede"
        submitLabel="Iniciar"
        switchHref="/register"
        switchLabel="Registrarse"
        action={mockAction}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
    const submitBtn = screen.getByRole("button", { name: /iniciar/i });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "wrongpassword");
    
    expect(passwordInput.value).toBe("wrongpassword");

    await user.click(submitBtn);

    await waitFor(() => {
      // The password input should be cleared
      expect(passwordInput.value).toBe("");
    });
  });
});

describe("AuthForm consent checkbox in register mode", () => {
  const mockRegisterAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterAction.mockReset();
  });

  it("shows consent checkbox in register mode", () => {
    render(
      <AuthForm
        isRegister={true}
        registerAction={mockRegisterAction}
      />
    );

    expect(screen.getByRole("checkbox", { name: /acepto/i })).toBeInTheDocument();
  });

  it("hides consent checkbox in login mode", () => {
    render(
      <AuthForm
        isRegister={false}
        loginAction={vi.fn()}
      />
    );

    expect(screen.queryByRole("checkbox", { name: /acepto/i })).not.toBeInTheDocument();
  });

  it("disables submit button when consent checkbox is unchecked in register mode", () => {
    render(
      <AuthForm
        isRegister={true}
        registerAction={mockRegisterAction}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /crear mi cuenta/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when consent checkbox is checked", async () => {
    const user = userEvent.setup();
    render(
      <AuthForm
        isRegister={true}
        registerAction={mockRegisterAction}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: /acepto/i });
    await user.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /crear mi cuenta/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
