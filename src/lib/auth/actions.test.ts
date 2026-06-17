import { beforeEach, describe, expect, it, vi } from "vitest";
import { authRateLimit } from "@/lib/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }) }));

vi.mock("@/lib/rate-limit", () => ({
  authRateLimit: { limit: vi.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 900000, pending: Promise.resolve() }) },
  getClientIdentifier: vi.fn().mockResolvedValue("127.0.0.1"),
}));

const signInWithPassword = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();
const signInWithOAuth = vi.fn();
const getUser = vi.fn();

function createMockSupabase(tenantResult: { data: unknown } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue(tenantResult);
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const eq = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    auth: { signInWithPassword, signUp, signOut, signInWithOAuth, getUser },
    from,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => createMockSupabase(null)),
}));

describe("auth server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authRateLimit.limit).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 900000, pending: Promise.resolve() });
  });

  it("signs in and redirects to /perfil when user has no tenant", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "owner@shop.com" } } });

    // Mock supabase to return no tenant
    const mockSupabase = createMockSupabase({ data: null });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { login } = await import("./actions");
    await expect(login(new FormDataBuilder().email("owner@shop.com").password("secret123").build())).rejects.toThrow(
      "NEXT_REDIRECT:/perfil",
    );
  });

  it("signs in and redirects to /dashboard when user has a tenant", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "owner@shop.com" } } });

    // Mock supabase to return an existing tenant
    const mockSupabase = createMockSupabase({ data: { id: "tenant-1" } });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { login } = await import("./actions");
    await expect(login(new FormDataBuilder().email("owner@shop.com").password("secret123").build())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
  });

  it("returns validation errors without calling Supabase", async () => {
    const { login } = await import("./actions");

    const result = await login(new FormDataBuilder().email("bad-email").password("123").build());

    expect(result.success).toBe(false);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signs up with email/password and redirects to /perfil (new users have no tenant)", async () => {
    signUp.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "owner@shop.com", email_confirmed_at: new Date().toISOString() } },
      error: null,
    });

    const { register } = await import("./actions");
    const formData = new FormDataBuilder()
      .email("owner@shop.com")
      .password("secret123")
      .confirmPassword("secret123")
      .build();

    await expect(register(formData)).rejects.toThrow(
      "NEXT_REDIRECT:/perfil",
    );

    expect(signUp).toHaveBeenCalledWith({
      email: "owner@shop.com",
      password: "secret123",
      options: { captchaToken: undefined },
    });
  });

  it("trims whitespace from email during login (no tenant → /perfil)", async () => {
    signInWithPassword.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "owner@shop.com" } } });

    const mockSupabase = createMockSupabase({ data: null });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { login } = await import("./actions");
    await expect(
      login(new FormDataBuilder().email("   owner@shop.com   ").password("secret123").build())
    ).rejects.toThrow("NEXT_REDIRECT:/perfil");

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
      .acceptedLegalTerms("true")
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
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "owner@shop.com" } } });

    const mockSupabase = createMockSupabase({ data: null });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { login } = await import("./actions");
    await expect(
      login(new FormDataBuilder().email("owner@shop.com").password("secret123").build())
    ).rejects.toThrow("NEXT_REDIRECT:/perfil");

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

  acceptedLegalTerms(value: string) {
    this.formData.set("accepted_legal_terms", value);
    return this;
  }

  build() {
    return this.formData;
  }
}

describe("rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks login when rate limit is exceeded", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValueOnce({
      success: false, limit: 5, remaining: 0, reset: Date.now() + 900000, pending: Promise.resolve(),
    });
    const { login } = await import("./actions");
    const result = await login(new FormDataBuilder().email("test@test.com").password("secret123").build());
    expect(result.success).toBe(false);
    expect(result.error).toContain("Demasiados intentos");
  });

  it("allows login when under rate limit (no tenant → /perfil)", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValueOnce({
      success: true, limit: 5, remaining: 4, reset: Date.now() + 900000, pending: Promise.resolve(),
    });
    signInWithPassword.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1", email: "test@test.com" } } });

    const mockSupabase = createMockSupabase({ data: null });
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { login } = await import("./actions");
    await expect(login(new FormDataBuilder().email("test@test.com").password("secret123").build()))
      .rejects.toThrow("NEXT_REDIRECT:/perfil");
  });

  it("blocks register when rate limit is exceeded", async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValueOnce({
      success: false, limit: 5, remaining: 0, reset: Date.now() + 900000, pending: Promise.resolve(),
    });
    const { register } = await import("./actions");
    const formData = new FormDataBuilder().email("test@test.com").password("secret123").confirmPassword("secret123").acceptedLegalTerms("true").build();
    const result = await register(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Demasiados intentos");
  });
});

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succeeds with a valid same-origin redirectTo", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("/auth/callback");

    expect(result.success).toBe(true);
    expect(result.data?.url).toBe("https://accounts.google.com/o/oauth2/auth");
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "/auth/callback" },
    });
  });

  it("rejects absolute HTTPS URL as redirectTo", async () => {
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("https://evil.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("URL de redirección inválida");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("rejects protocol-relative URL as redirectTo", async () => {
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("//evil.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("URL de redirección inválida");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("rejects javascript: protocol as redirectTo", async () => {
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("javascript:alert(1)");

    expect(result.success).toBe(false);
    expect(result.error).toContain("URL de redirección inválida");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("rejects empty string as redirectTo", async () => {
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("");

    expect(result.success).toBe(false);
    expect(result.error).toContain("URL de redirección inválida");
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("returns error when Supabase OAuth fails", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      data: null,
      error: { message: "Provider not enabled" },
    });
    const { signInWithGoogle } = await import("./actions");

    const result = await signInWithGoogle("/auth/callback");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al procesar la solicitud");
  });
});

describe("register consent validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authRateLimit.limit).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() + 900000, pending: Promise.resolve() });
  });

  it("rejects register when accepted_legal_terms is missing", async () => {
    const { register } = await import("./actions");
    const formData = new FormDataBuilder()
      .email("test@test.com")
      .password("secret123")
      .confirmPassword("secret123")
      .build();

    const result = await register(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Debes aceptar los términos");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("rejects register when accepted_legal_terms is 'false'", async () => {
    const { register } = await import("./actions");
    const formData = new FormDataBuilder()
      .email("test@test.com")
      .password("secret123")
      .confirmPassword("secret123")
      .acceptedLegalTerms("false")
      .build();

    const result = await register(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Debes aceptar los términos");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("allows register when accepted_legal_terms is 'true'", async () => {
    signUp.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "test@test.com", email_confirmed_at: new Date().toISOString() } },
      error: null,
    });

    const mockSupabase = createMockSupabase(null);
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as SupabaseClient);

    const { register } = await import("./actions");
    const formData = new FormDataBuilder()
      .email("test@test.com")
      .password("secret123")
      .confirmPassword("secret123")
      .acceptedLegalTerms("true")
      .build();

    // register will successfully pass consent validation and call signUp,
    // then redirect throws NEXT_REDIRECT — we catch it as success
    await expect(register(formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(signUp).toHaveBeenCalled();
  });
});