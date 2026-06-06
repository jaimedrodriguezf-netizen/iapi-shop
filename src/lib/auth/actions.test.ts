import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }) }));

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword, signUp, signOut },
  })),
}));

describe("auth server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("signs in with email/password and redirects to dashboard", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    const { login } = await import("./actions");

    await expect(login(new FormDataBuilder().email("owner@shop.com").password("secret123").build())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "owner@shop.com",
      password: "secret123",
      options: { captchaToken: undefined },
    });
  });

  it("returns validation errors without calling Supabase", async () => {
    const { login } = await import("./actions");

    const result = await login(new FormDataBuilder().email("bad-email").password("123").build());

    expect(result.success).toBe(false);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs up with email/password and redirects to dashboard", async () => {
    signUp.mockResolvedValueOnce({ error: null });
    const { register } = await import("./actions");

    const formData = new FormDataBuilder()
      .email("owner@shop.com")
      .password("secret123")
      .confirmPassword("secret123")
      .build();

    await expect(register(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );

    expect(signUp).toHaveBeenCalledWith({
      email: "owner@shop.com",
      password: "secret123",
      options: { captchaToken: undefined },
    });
  });

  it("trims whitespace from email during login", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    const { login } = await import("./actions");

    await expect(
      login(new FormDataBuilder().email("   owner@shop.com   ").password("secret123").build())
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "owner@shop.com",
      password: "secret123",
      options: { captchaToken: undefined },
    });
  });

  it("returns error on rate-limit / too many requests from Supabase", async () => {
    signInWithPassword.mockResolvedValueOnce({
      error: { message: "Too many requests", status: 429 },
    });
    const { login } = await import("./actions");

    const result = await login(
      new FormDataBuilder().email("owner@shop.com").password("secret123").build()
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("No pudimos iniciar sesión");
  });

  it("returns validation error on mismatched password and confirmPassword on sign up", async () => {
    const { register } = await import("./actions");

    const formData = new FormDataBuilder()
      .email("owner@shop.com")
      .password("secret123")
      .confirmPassword("different123")
      .build();

    const result = await register(formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmPassword).toContain("Las contraseñas no coinciden.");
  });

  it("rejects emails longer than 255 characters", async () => {
    const { login } = await import("./actions");
    const longEmail = "a".repeat(246) + "@example.com"; // 258 chars
    const result = await login(
      new FormDataBuilder().email(longEmail).password("secret123").build()
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.email).toContain("El email no puede tener más de 255 caracteres.");
  });

  it("rejects passwords longer than 72 characters", async () => {
    const { login } = await import("./actions");
    const longPassword = "a".repeat(73); // 73 chars
    const result = await login(
      new FormDataBuilder().email("owner@shop.com").password(longPassword).build()
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toContain("La contraseña no puede tener más de 72 caracteres.");
  });

  it("signs out any existing session before performing new login", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    signOut.mockResolvedValueOnce({ error: null });
    const { login } = await import("./actions");

    await expect(
      login(new FormDataBuilder().email("owner@shop.com").password("secret123").build())
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(signOut).toHaveBeenCalled();
    const signOutOrder = signOut.mock.invocationCallOrder[0];
    const signInOrder = signInWithPassword.mock.invocationCallOrder[0];
    expect(signOutOrder).toBeLessThan(signInOrder);
  });
});

class FormDataBuilder {
  private formData = new FormData();

  email(value: string) {
    this.formData.set("email", value);
    return this;
  }

  password(value: string) {
    this.formData.set("password", value);
    return this;
  }

  confirmPassword(value: string) {
    this.formData.set("confirmPassword", value);
    return this;
  }

  build() {
    return this.formData;
  }
}
