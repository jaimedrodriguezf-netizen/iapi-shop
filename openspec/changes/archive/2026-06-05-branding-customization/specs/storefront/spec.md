# Dynamic Storefront Specification

## Purpose

Branding injection into the public storefront at `/[slug]`.

## Requirements

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
