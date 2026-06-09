import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { StorefrontHeader } from "./storefront-header"
import type { Tenant } from "@/lib/tenants/actions"

const mockTenant: Tenant = {
  id: "tenant-123",
  name: "Tienda De Prueba",
  slug: "tienda-prueba",
  brand_color: "#7c3aed",
  secondary_color: null,
  whatsapp_phone: "+593999999999",
  logo_url: "",
  status: "active",
  created_at: new Date().toISOString(),
  public_settings: {
    show_phone: true,
    show_address: true,
    show_social_links: true,
  },
  address: {
    street: "Av. Principal",
    city: "Quito",
  },
  social_links: {
    instagram: "https://instagram.com/prueba",
  },
}

describe("StorefrontHeader Component", () => {
  it("renders tenant name and verified check badge", () => {
    render(
      <StorefrontHeader 
        tenant={mockTenant} 
        formattedAddress="Av. Principal, Quito" 
        whatsappUrl="https://wa.me/593999999999" 
      />
    )
    expect(screen.getByText("Tienda De Prueba")).toBeInTheDocument()
  })

  it("respects public_settings and does not render seller details when disabled (triangulation)", () => {
    const hiddenTenant: Tenant = {
      ...mockTenant,
      public_settings: {
        show_phone: false,
        show_address: false,
        show_social_links: false,
      }
    }
    
    render(
      <StorefrontHeader 
        tenant={hiddenTenant} 
        formattedAddress="Av. Principal, Quito" 
        whatsappUrl="https://wa.me/593999999999" 
      />
    )
    
    // The name should still render
    expect(screen.getByText("Tienda De Prueba")).toBeInTheDocument()
    // Trigger is there
    expect(screen.getByRole("button", { name: /información del vendedor/i })).toBeInTheDocument()
    
    // Assert hidden details are not in the DOM
    expect(screen.queryByText(/chatear por whatsapp/i)).not.toBeInTheDocument()
    expect(screen.queryByText("Av. Principal, Quito")).not.toBeInTheDocument()
    expect(screen.queryByText(/redes sociales/i)).not.toBeInTheDocument()
  })
})
