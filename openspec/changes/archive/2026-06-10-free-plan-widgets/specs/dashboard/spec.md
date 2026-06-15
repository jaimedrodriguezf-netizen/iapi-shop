# Free Plan Dashboard Widgets Specification

## Purpose

Improve the merchant experience on the Free plan, encouraging platform onboarding and plan upgrades by displaying usage limits, setup progress (checklist), and premium upgrade benefits directly on the merchant dashboard instead of the standard sales chart and branches table.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Onboarding Checklist Widget | MUST | Display onboarding checklist with tasks, progress percentage, and progress bar. |
| R2 | Usage Limits Widget | MUST | Display product and branch limit progress. Warn when product limits are reached and show an upgrade CTA. |
| R3 | Premium Benefits Widget | MUST | Show Plan Plus/Premium benefits and CTA to upgrade. |
| R4 | Conditional Dashboard Layout | MUST | Conditionally render Free plan widgets or Premium sales/branches layout based on user's active subscription plan. |

### Requirement: Onboarding Checklist Widget

The system MUST provide an `OnboardingChecklistWidget` on the dashboard page for Free plan merchants. The widget:
- SHALL display the progress of setting up the shop.
- SHALL show a progress bar indicating the percentage of completed tasks.
- SHALL track and check off four specific setup tasks:
  1. **Personalizar nombre de la tienda**: Checked if the shop name is not equal to `"Mi Tienda"`.
  2. **Personalizar URL de la tienda**: Checked if the slug is not empty and does not start with `"tienda-"`.
  3. **Configurar número de WhatsApp**: Checked if the WhatsApp phone is not empty or empty spaces.
  4. **Agregar al menos un producto**: Checked if the product count is greater than 0.

#### Scenario: Onboarding Checklist displays incomplete status
- GIVEN a merchant on the Free plan with default settings (name is "Mi Tienda", slug starts with "tienda-", no WhatsApp phone configured, and 0 products)
- WHEN they view the dashboard
- THEN the `OnboardingChecklistWidget` shows 0% progress
- AND all four tasks are unchecked and styled as incomplete.

#### Scenario: Onboarding Checklist updates progress dynamically
- GIVEN a merchant on the Free plan with a customized shop name, a customized URL slug, a configured WhatsApp phone, and 2 products in their catalog
- WHEN they view the dashboard
- THEN the `OnboardingChecklistWidget` shows 100% progress
- AND all four tasks are checked off (with line-through styling).

---

### Requirement: Usage Limits Widget

The system MUST provide a `UsageLimitsWidget` displaying the current and maximum usage limits for products and branches (shops). The widget:
- SHALL display a product progress bar representing `(currentProducts / productLimit) * 100`.
- SHALL display a branches progress bar representing `(currentShops / shopLimit) * 100`.
- MUST display a warning notification banner and an upgrade CTA ("Mejorar Plan") when the product limit is reached or exceeded.
- SHALL dynamically color the product progress bar to amber (`bg-amber-500`) when the limit is reached, instead of the default violet (`bg-violet-600`).

#### Scenario: Merchant below limits does not see warning
- GIVEN a merchant with 3 active products (limit is 10) and 1 shop (limit is 1)
- WHEN they view the dashboard
- THEN the `UsageLimitsWidget` renders both progress bars with violet fill
- AND no warning banner or "Mejorar Plan" CTA is displayed.

#### Scenario: Merchant reaches product limit
- GIVEN a merchant with 10 active products (limit is 10)
- WHEN they view the dashboard
- THEN the product progress bar is rendered with amber fill
- AND a warning alert text "⚠️ Has alcanzado el límite de productos. Actualiza tu plan para seguir agregando más." is displayed
- AND a button styled as "Mejorar Plan" targeting `/#pricing-title` is shown.

---

### Requirement: Premium Benefits Widget

The system MUST display a `PremiumBenefitsWidget` to merchants on the Free plan, showing the advantages of upgrading to a premium subscription. The widget:
- SHALL highlight the benefits:
  1. Catálogo público sin restricciones
  2. Estadísticas detalladas de ventas y rendimiento
  3. Hasta 300 productos activos
  4. Hasta 3 fotos por producto
- SHALL include a prominent CTA button "Obtener Plan Plus" linking to `/#pricing-title`.

#### Scenario: Premium benefits are rendered
- GIVEN a merchant on the Free plan viewing the dashboard
- WHEN the page loads
- THEN the `PremiumBenefitsWidget` is displayed on the dashboard
- AND the list of benefits is shown
- AND a button styled as "Obtener Plan Plus" redirecting to the pricing section is visible.

---

### Requirement: Conditional Dashboard Layout

The dashboard page (`/dashboard`) MUST dynamically choose which widgets to display based on the merchant's subscription plan.
- If the merchant has a `"Free"` plan, the dashboard page SHALL hide the monthly sales performance chart and the branches summary table, and render the `OnboardingChecklistWidget`, `UsageLimitsWidget`, and `PremiumBenefitsWidget`.
- If the merchant has any plan other than `"Free"` (e.g. `"Premium"`, `"Plus"`, `"Business"`, or platform admin role), the dashboard page SHALL show the sales chart and branches table, and hide the free plan widgets.

#### Scenario: Dashboard layout for Free plan merchant
- GIVEN an authenticated merchant on a "Free" subscription plan
- WHEN they navigate to `/dashboard`
- THEN the page fetches their subscription details, product count, and limits
- AND renders `OnboardingChecklistWidget`, `UsageLimitsWidget`, and `PremiumBenefitsWidget`
- AND does NOT render the sales chart (`SampleSalesChart`) or branches summary table (`ShopSummaryTable`).

#### Scenario: Dashboard layout for Premium plan merchant
- GIVEN an authenticated merchant on a "Premium" or paid subscription plan
- WHEN they navigate to `/dashboard`
- THEN the page fetches their subscription details
- AND renders the sales performance chart (`SampleSalesChart`) and the branches summary table (`ShopSummaryTable`)
- AND does NOT render the onboarding checklist, limits, or premium benefits widgets.
