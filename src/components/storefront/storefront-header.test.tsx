import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { StorefrontHeader } from "./storefront-header"

describe("StorefrontHeader Component", () => {
  it("renders tenant name", () => {
    render(
      <StorefrontHeader 
        tenantName="Tienda De Prueba" 
        tenantId="tenant-123"
        brandColor="#f97316"
      />
    )
    expect(screen.getByText("Tienda De Prueba")).toBeInTheDocument()
  })

  it("renders with default brand color when not provided", () => {
    render(
      <StorefrontHeader 
        tenantName="Mi Tienda" 
        tenantId="tenant-456"
      />
    )
    expect(screen.getByText("Mi Tienda")).toBeInTheDocument()
  })

  it("shows search bar on desktop", () => {
    render(
      <StorefrontHeader 
        tenantName="Tienda De Prueba" 
        tenantId="tenant-123"
        brandColor="#f97316"
      />
    )
    expect(screen.getByPlaceholderText("Buscar...")).toBeInTheDocument()
  })
})