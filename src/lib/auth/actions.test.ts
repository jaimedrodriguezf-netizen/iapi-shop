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

    expect(signInWithPassword).toHaveBeenCalledWith({ email: "owner@shop.com", password: "secret123" });
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

    expect(signUp).toHaveBeenCalledWith({ email: "owner@shop.com", password: "secret123" });
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
