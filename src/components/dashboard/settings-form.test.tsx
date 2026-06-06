import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsForm } from "./settings-form";
import userEvent from "@testing-library/user-event";
import { updateTenantSettings } from "@/lib/tenants/actions";

// Mock updateTenantSettings
vi.mock("@/lib/tenants/actions", () => ({
  updateTenantSettings: vi.fn(),
}));

const mockTenant = {
  id: "tenant-123",
  name: "Mi Tienda",
  slug: "tienda-abcde",
  status: "draft",
  brand_color: "#7c3aed",
  secondary_color: "",
  address: null,
  social_links: null,
  created_at: "2026-06-05T12:00:00Z",
};

describe("SettingsForm UI and client-side validation tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial values and disables the status toggle if default name/slug are present", () => {
    render(<SettingsForm tenant={mockTenant} />);

    const nameInput = screen.getByLabelText(/nombre de la tienda/i);
    const slugInput = screen.getByLabelText(/dirección web/i);
    const toggle = screen.getByLabelText(/publicar tienda/i) as HTMLInputElement;

    expect(nameInput).toHaveValue("Mi Tienda");
    expect(slugInput).toHaveValue("tienda-abcde");
    expect(toggle).toBeDisabled();
    expect(toggle.checked).toBe(false);
  });

  it("enables the toggle when name and slug are customized", async () => {
    const user = userEvent.setup();
    render(<SettingsForm tenant={mockTenant} />);

    const nameInput = screen.getByLabelText(/nombre de la tienda/i);
    const slugInput = screen.getByLabelText(/dirección web/i);
    const toggle = screen.getByLabelText(/publicar tienda/i) as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, "Mi Tienda Custom");

    await user.clear(slugInput);
    await user.type(slugInput, "mi-tienda-custom");

    await waitFor(() => {
      expect(toggle).not.toBeDisabled();
    });
  });

  it("automatically resets status to draft if name/slug are reset to defaults while status is active", async () => {
    const user = userEvent.setup();
    const activeTenant = { ...mockTenant, name: "Tienda Custom", slug: "mi-tienda-custom", status: "active" };
    render(<SettingsForm tenant={activeTenant} />);

    const nameInput = screen.getByLabelText(/nombre de la tienda/i);
    const toggle = screen.getByLabelText(/publicar tienda/i) as HTMLInputElement;

    expect(toggle).not.toBeDisabled();
    expect(toggle.checked).toBe(true);

    // Set name back to default "Mi Tienda"
    await user.clear(nameInput);
    await user.type(nameInput, "Mi Tienda");

    await waitFor(() => {
      expect(toggle.checked).toBe(false);
      expect(toggle).toBeDisabled();
    });
  });
});
