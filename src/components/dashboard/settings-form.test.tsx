import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsForm } from "./settings-form";
import userEvent from "@testing-library/user-event";

// Mock updateTenantSettings and geographic actions
vi.mock("@/lib/tenants/actions", () => ({
  updateTenantSettings: vi.fn(),
  checkSlugAvailability: vi.fn().mockResolvedValue({ available: true }),
  getCountries: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getProvincesByCountryId: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getCantonsByProvinceId: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

import { getCountries, getProvincesByCountryId, getCantonsByProvinceId } from "@/lib/tenants/actions";

const mockTenant = {
  id: "tenant-123",
  name: "Mi Tienda",
  slug: "tienda-abcde",
  status: "draft",
  brand_color: "#f97316",
  secondary_color: "",
  address: null,
  social_links: null,
  created_at: "2026-06-05T12:00:00Z",
};

const mockPalettes = [
  { id: "p1", name: "Pastel", brand_color: "#fbcfe8", secondary_color: "#bae6fd", created_at: "2026-06-09T00:00:00Z" },
  { id: "p2", name: "Warm", brand_color: "#f97316", secondary_color: "#facc15", created_at: "2026-06-09T00:00:00Z" },
];

const mockCountries = [
  { id: "c-ec", name: "Ecuador", code: "EC" },
  { id: "c-co", name: "Colombia", code: "CO" },
  { id: "c-pe", name: "Peru", code: "PE" },
];

const mockProvinces = [
  { id: "p-pic", country_id: "c-ec", name: "Pichincha" },
  { id: "p-gua", country_id: "c-ec", name: "Guayas" },
];

const mockCantons = [
  { id: "can-qui", province_id: "p-pic", name: "Quito" },
  { id: "can-cay", province_id: "p-pic", name: "Cayambe" },
];

describe("SettingsForm UI and client-side validation tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCountries).mockResolvedValue({ success: true, data: mockCountries });
    vi.mocked(getProvincesByCountryId).mockResolvedValue({ success: true, data: mockProvinces });
    vi.mocked(getCantonsByProvinceId).mockResolvedValue({ success: true, data: mockCantons });
  });

  it("renders with initial values and disables the status toggle if default name/slug are present", () => {
    render(<SettingsForm tenant={mockTenant} palettes={mockPalettes} countries={mockCountries} />);

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
    render(<SettingsForm tenant={mockTenant} planName="Premium" palettes={mockPalettes} countries={mockCountries} />);

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
    render(<SettingsForm tenant={activeTenant} planName="Premium" palettes={mockPalettes} countries={mockCountries} />);

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

  it("locks the toggle to disabled/draft if default name/slug are present, but enables it when customized even on Free plan, and enables color selection", async () => {
    const user = userEvent.setup();
    render(<SettingsForm tenant={mockTenant} planName="Free" palettes={mockPalettes} countries={mockCountries} />);

    const nameInput = screen.getByLabelText(/nombre de la tienda/i);
    const slugInput = screen.getByLabelText(/dirección web/i);
    const toggle = screen.getByLabelText(/publicar tienda/i) as HTMLInputElement;

    // 1. Check that if customization is NOT set (default name/slug), status is draft and toggle is disabled.
    expect(toggle).toBeDisabled();
    expect(toggle.checked).toBe(false);

    // 2. Check that if customization IS set, the toggle is enabled for Free plans.
    await user.clear(nameInput);
    await user.type(nameInput, "Mi Tienda Custom");
    await user.clear(slugInput);
    await user.type(slugInput, "mi-tienda-custom");

    await waitFor(() => {
      expect(toggle).not.toBeDisabled();
    });

    // 3. Verify color preset buttons are fully enabled on Free plan
    const presetButton = screen.getByTitle("Pastel");
    expect(presetButton).not.toBeDisabled();

    // 4. Verify custom color pickers and hex inputs are enabled on Free plan
    const brandColorPickerBtn = screen.getByTitle("Color Primario Personalizado");
    expect(brandColorPickerBtn).not.toBeDisabled();

    const secondaryColorPickerBtn = screen.getByTitle("Color Secundario Personalizado");
    expect(secondaryColorPickerBtn).not.toBeDisabled();

    const hexBrandInput = screen.getByLabelText(/hex color primario/i);
    expect(hexBrandInput).not.toBeDisabled();

    const hexSecondaryInput = screen.getByLabelText(/hex color secundario/i);
    expect(hexSecondaryInput).not.toBeDisabled();
  });

  it("correctly populates brand_color and secondary_color when a palette preset is clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsForm tenant={mockTenant} planName="Premium" palettes={mockPalettes} countries={mockCountries} />);

    const presetButton = screen.getByTitle("Warm");
    await user.click(presetButton);

    const hexBrandInput = screen.getByLabelText(/hex color primario/i);
    const hexSecondaryInput = screen.getByLabelText(/hex color secundario/i);

    expect(hexBrandInput).toHaveValue("#f97316");
    expect(hexSecondaryInput).toHaveValue("#facc15");
  });

  it("renders state/province and city/canton as plain text when country is not Ecuador", () => {
    const tenantColombia = {
      ...mockTenant,
      address: {
        street: "Calle Falsa 123",
        city: "Bogotá",
        state: "Cundinamarca",
        zip: "110111",
        country: "Colombia",
      },
    };
    render(<SettingsForm tenant={tenantColombia} palettes={mockPalettes} countries={mockCountries} />);

    const cityInput = screen.getByLabelText(/ciudad/i);
    const stateInput = screen.getByLabelText(/provincia \/ estado/i);

    expect(cityInput.tagName).toBe("INPUT");
    expect(stateInput.tagName).toBe("INPUT");
    expect(cityInput).toHaveValue("Bogotá");
    expect(stateInput).toHaveValue("Cundinamarca");
  });

  it("parses legacy JSON string addresses correctly", async () => {
    const tenantJson = {
      ...mockTenant,
      address: '{"street":"Av. Shyris 456","city":"Quito","state":"Pichincha","zip":"170150","country":"Ecuador"}',
    };
    render(<SettingsForm tenant={tenantJson} palettes={mockPalettes} countries={mockCountries} />);

    const streetInput = screen.getByLabelText(/calle y número/i);
    expect(streetInput).toHaveValue("Av. Shyris 456");

    // Wait for the async province load to finish to avoid act warnings
    await waitFor(() => {
      expect(getProvincesByCountryId).toHaveBeenCalledWith("c-ec");
    });
  });

  it("renders selects for state and city when country is Ecuador and loads provinces", async () => {
    const tenantEcuador = {
      ...mockTenant,
      address: {
        street: "Av. Amazonas 123",
        city: "Quito",
        state: "Pichincha",
        zip: "170150",
        country: "Ecuador",
      },
    };
    render(<SettingsForm tenant={tenantEcuador} palettes={mockPalettes} countries={mockCountries} />);

    // Since country is Ecuador, it should trigger the getProvincesByCountryId action
    await waitFor(() => {
      expect(getProvincesByCountryId).toHaveBeenCalledWith("c-ec");
    });
  });

  it("resets state and city when country selection changes from Ecuador to another country", async () => {
    const user = userEvent.setup();
    const tenantEcuador = {
      ...mockTenant,
      address: {
        street: "Av. Amazonas 123",
        city: "Quito",
        state: "Pichincha",
        zip: "170150",
        country: "Ecuador",
      },
    };
    render(<SettingsForm tenant={tenantEcuador} palettes={mockPalettes} countries={mockCountries} />);

    await waitFor(() => {
      expect(getProvincesByCountryId).toHaveBeenCalledWith("c-ec");
    });

    const countryTrigger = screen.getByLabelText(/país/i);
    await user.click(countryTrigger);

    const colombiaOption = await screen.findByText("Colombia");
    await user.click(colombiaOption);

    await waitFor(() => {
      const cityInput = screen.getByLabelText(/ciudad/i);
      const stateInput = screen.getByLabelText(/provincia \/ estado/i);
      expect(cityInput).toHaveValue("");
      expect(stateInput).toHaveValue("");
      expect(cityInput.tagName).toBe("INPUT");
      expect(stateInput.tagName).toBe("INPUT");
    });
  });
});

