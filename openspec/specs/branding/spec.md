# Canva Color Palette and Customization Specification

## Purpose

Define the requirements for dynamic database-driven predefined color palettes (Canva-style), settings page brand color input controls, unlocking brand color customization for Free plan tenants, and dynamically rendering both primary and secondary brand colors on the public storefront catalog.

## Requirements

### Requirement: Database-Driven Predefined Palettes

The system MUST store and retrieve predefined Canva-style color palettes dynamically from a database table named `color_palettes` rather than hardcoding them client-side. Each palette record SHALL contain a unique identifier, name, primary `brand_color`, and `secondary_color`.

#### Scenario: Retrieve all predefined color palettes

- GIVEN the database contains the seeded predefined color palettes (`Pastel`, `Warm`, `Neon`, `Tech`, `Nordic`)
- WHEN a request is made to retrieve all available color palettes
- THEN the system MUST return a list containing all five predefined palettes
- AND each returned palette record MUST include its unique identifier, name, primary brand color, and secondary color.

### Requirement: Settings Page Brand Color Form

The settings brand customization form MUST fetch and render the list of predefined Canva color palettes retrieved from the database. It MUST support custom color pickers for both `brand_color` (primary) and `secondary_color`. Selecting a predefined palette preset MUST update both the primary and secondary color input fields, and saving the form MUST persist these values.

#### Scenario: Select predefined color palette preset

- GIVEN the brand settings form is loaded with the predefined palettes list
- WHEN the user clicks on the "Warm" palette option (Brand Color: `#f97316`, Secondary Color: `#facc15`)
- THEN the brand color input value MUST update to `#f97316`
- AND the secondary color input value MUST update to `#facc15`
- AND the form fields MUST reflect the updated values before saving.

#### Scenario: Select custom brand and secondary colors

- GIVEN the brand settings form is loaded
- WHEN the user selects the custom option and inputs `#06b6d4` for the brand color and `#f43f5e` for the secondary color
- THEN the form MUST accept both values
- AND the live storefront preview on the settings page MUST reflect both custom colors immediately.

### Requirement: Free Plan Colors Unlocked

Color customization fields MUST be fully enabled and interactive for tenants on the Free plan, removing prior plan-based disables or locks. The system SHALL NOT override, reset, or discard custom brand or secondary colors back to the default color (`#7c3aed`) for Free plan tenants.

#### Scenario: Free plan tenant modifies brand and secondary colors

- GIVEN a tenant account on the Free plan is authenticated and viewing the brand settings form
- WHEN the user inputs a custom primary brand color `#10b981` and a custom secondary color `#f59e0b` and clicks "Save"
- THEN the form MUST NOT display plan restriction locks
- AND the system MUST successfully save the settings
- AND the saved colors MUST NOT be reset to the default `#7c3aed`.

### Requirement: Storefront Dynamic Brand Theme

The storefront layout container MUST dynamically apply `--brand-color` and `--secondary-color` as CSS custom properties based on the tenant's settings, regardless of their plan. The storefront UI components MUST render styles using the `--secondary-color` CSS variable for:
- Non-active category pills hover text and border states.
- Background color of product badges (specifically the `⭐ Top` product badge).
- Floating items count badge and text highlights in the cart drawer.
- Border and text transition/hover effects on product catalog cards and card names.

#### Scenario: Injecting custom properties into storefront layout

- GIVEN a storefront with a configured primary brand color of `#0f172a` and secondary color of `#3b82f6`
- WHEN the storefront page is rendered
- THEN the root container layout MUST declare the CSS custom properties `--brand-color: #0f172a` and `--secondary-color: #3b82f6`.

#### Scenario: Storefront component styling with secondary color

- GIVEN a storefront page is rendered with custom CSS properties `--brand-color` and `--secondary-color`
- WHEN the user views the page and interacts with catalog elements
- THEN the category pills non-active state hover borders and text MUST render using `--secondary-color`
- AND the background of the `⭐ Top` product badge MUST render using `--secondary-color`
- AND the product card names and borders hover effects MUST transition using `--secondary-color`
- AND the cart drawer items count badge background MUST render using `--secondary-color`.
