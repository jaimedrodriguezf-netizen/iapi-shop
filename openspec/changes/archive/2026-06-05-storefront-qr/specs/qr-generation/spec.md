# QR Generation Specification

## Purpose

Generate and serve QR codes for each sucursal so merchants can distribute their public storefront link via print, social media, or signage.

## Requirements

### Requirement: QR Code Generation

The system MUST provide a utility to generate QR codes from a sucursal's public URL.

#### Scenario: Generate QR from tenant slug

- GIVEN the current environment base URL and a tenant slug `mi-tienda`
- WHEN `generateQR(slug)` is called
- THEN a QR code MUST be produced as an SVG or Base64 PNG data URI
- AND the encoded URL MUST be an absolute URL (e.g. `https://iapi.shop/mi-tienda`)

#### Scenario: Environment-aware URL

- GIVEN the application is running in development mode
- WHEN a QR code is generated
- THEN the encoded URL SHALL use the dev base URL (e.g. Tailscale IP during verification)
- AND in production, it SHALL use the production domain

#### Scenario: Invalid or empty slug

- GIVEN an empty or undefined slug
- WHEN `generateQR(slug)` is called
- THEN the function SHALL return an error or throw

### Requirement: Dashboard QR Display

The system SHALL display the QR code on a dedicated dashboard page accessible to authenticated tenant members.

#### Scenario: Authenticated member views QR page

- GIVEN a user is authenticated and belongs to tenant "Farmacia Salud"
- WHEN they navigate to `/dashboard/qr`
- THEN the page MUST display the QR code for their tenant's storefront URL
- AND the human-readable URL MUST be shown alongside the QR

#### Scenario: Unauthenticated user blocked

- GIVEN a user is not authenticated
- WHEN they navigate to `/dashboard/qr`
- THEN the system SHALL redirect to the login page

### Requirement: QR Code Download

The system SHALL allow merchants to download their QR code as a raster image.

#### Scenario: Download QR as PNG

- GIVEN a QR code is displayed on `/dashboard/qr`
- WHEN the user clicks "Descargar QR"
- THEN a PNG file SHALL be downloaded to their device
- AND the filename SHOULD include the tenant slug (e.g. `qr-farmacia-salud.png`)
