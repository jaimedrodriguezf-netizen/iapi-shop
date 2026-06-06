# Storefront Specification

## Purpose

Public-facing catalog that end-customers reach by scanning a QR code or visiting a `/[slug]` URL. Must be mobile-first, lightweight, and multi-tenant safe.

## Requirements

### Requirement: Dynamic Route Resolution

The system MUST resolve a dynamic segment `[slug]` to a tenant (sucursal) and render its public catalog.

#### Scenario: Valid slug loads catalog

- GIVEN a tenant exists with slug `mi-tienda`
- WHEN a user navigates to `/mi-tienda`
- THEN the page renders the tenant's public catalog

#### Scenario: Invalid slug shows not-found

- GIVEN no tenant exists with slug `fantasma`
- WHEN a user navigates to `/fantasma`
- THEN the system SHALL return a 404 response

#### Scenario: Slug collision with internal routes

- GIVEN an internal route `/dashboard` exists
- WHEN a user navigates to `/dashboard`
- THEN Next.js static route priority MUST resolve before the `[slug]` catch-all

### Requirement: Tenant Data Fetching

The system MUST fetch tenant metadata and published products server-side for the matched slug, respecting multi-tenant isolation.

#### Scenario: Server-side fetch for matched tenant

- GIVEN a tenant with slug `mi-tienda` and 5 published products
- WHEN the server component fetches data for `[slug]` = `mi-tienda`
- THEN the query MUST filter by `tenant_id` and `published = true`
- AND return only products belonging to that tenant

#### Scenario: Tenant has no published products

- GIVEN a tenant exists but has zero published products
- WHEN the storefront page loads
- THEN the system SHALL display an empty-catalog message

### Requirement: Mobile-First Product Catalog

The system SHALL render a responsive product catalog with category filtering, optimized for mobile browsers.

#### Scenario: Products grouped by category

- GIVEN a tenant has products in categories "Bebidas" and "Snacks"
- WHEN the storefront renders
- THEN products MUST be grouped under their category headings
- AND categories with no products SHALL be hidden

#### Scenario: Category filter selection

- GIVEN multiple product categories exist
- WHEN a user taps a category filter chip
- THEN only products from the selected category MUST be displayed
- AND the active filter MUST be visually distinguished

#### Scenario: Responsive grid adapts to viewport

- GIVEN the storefront is loaded
- WHEN viewed on a mobile device (viewport < 768px)
- THEN product cards MUST render in a single-column layout
- AND on larger screens, use a multi-column grid

### Requirement: Dynamic SEO Metadata

The system MUST generate dynamic `<title>` and `<meta>` tags based on the tenant's display name.

#### Scenario: SEO title includes tenant name

- GIVEN a tenant named "Farmacia Salud"
- WHEN the storefront page renders
- THEN the `<title>` tag MUST include "Farmacia Salud"
- AND `og:title` MUST be set to the same value

#### Scenario: Default description fallback

- GIVEN a tenant has no custom description set
- WHEN the metadata is generated
- THEN `description` meta tag SHALL use "Catálogo de productos de {tenant name}" as fallback

### Requirement: Brand color injection

The storefront page `/[slug]` MUST inject the tenant's `brand_color` as a CSS custom property `--brand-color`. When `brand_color` is `NULL`, the system SHALL fall back to the default violet theme.

#### Scenario: Tenant with brand color set

- GIVEN a tenant has `brand_color = "#22c55e"`
- WHEN a visitor opens `/[slug]`
- THEN `--brand-color: #22c55e` is injected
- AND buttons, icons, and highlights render with that color.

#### Scenario: Tenant without brand color

- GIVEN a tenant has `brand_color = NULL`
- WHEN a visitor opens `/[slug]`
- THEN the default violet theme applies.

### Requirement: Action button theming

The "Add to Cart" and "Checkout" buttons MUST use the dynamic `--brand-color` as their background. Hover and active states SHALL derive darker/lighter variants of the brand color.

#### Scenario: Add to Cart uses brand color

- GIVEN `--brand-color` is `#ef4444`
- WHEN the product page renders
- THEN the "Add to Cart" button has background `#ef4444`
- AND the hover state is a slightly darker variant.

### Requirement: Contact information footer

The storefront footer MUST display the tenant's `address` (formatted as a single line) and `social_links` (as clickable platform icons). When either is `NULL`, that section SHALL be hidden.

#### Scenario: Full contact info displayed

- GIVEN a tenant has `address = { street: "Calle 1", city: "Quito", state: "Pichincha", zip: "170150", country: "Ecuador" }`
- AND `social_links = { instagram: "https://..." }`
- WHEN the storefront renders
- THEN the footer shows "Calle 1, Quito, Pichincha, 170150, Ecuador"
- AND an Instagram icon links to the provided URL.

#### Scenario: No contact info set

- GIVEN a tenant has `address = NULL` and `social_links = NULL`
- WHEN the storefront renders
- THEN the contact footer section is not rendered.

### Requirement: Logo display

The storefront MUST display the tenant's logo or a fallback initial. When a logo URL exists, an `<img>` SHALL render it. When no logo is set, the first character of the tenant name SHALL render as a styled fallback.

#### Scenario: Logo URL exists

- GIVEN a tenant has a `logo_url`
- WHEN the storefront renders
- THEN the logo image is displayed.

#### Scenario: No logo, fallback initial

- GIVEN a tenant named "Mi Tienda" has no `logo_url`
- WHEN the storefront renders
- THEN a fallback shows the letter "M" styled with the brand color.

### Requirement: Instant reflection

Branding changes saved in the dashboard MUST reflect on the next storefront request without cache delay. The page SHALL revalidate tenant data on each request using Next.js cache invalidation.

#### Scenario: Color change visible after save

- GIVEN an owner changes brand_color from `#000000` to `#22c55e`
- WHEN a visitor reloads `/[slug]`
- THEN the storefront renders with `#22c55e`.

