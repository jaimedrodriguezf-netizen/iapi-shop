# Tasks: Branding & Personalization

## Phase 1: Database & Logic
- [x] 1.1 Create migration to add `brand_color`, `secondary_color`, `address`, and `social_links` to `tenants`.
- [x] 1.2 Implement `updateTenantSettings` server action in `src/lib/tenants/actions.ts`.
- [x] 1.3 Add unit tests for settings updates.

## Phase 2: Settings Interface
- [x] 2.1 Create `/dashboard/settings` page.
- [x] 2.2 Implement a color picker component (or curated list) for `brand_color`.
- [x] 2.3 Build the contact info and social links section with dynamic form fields.
- [x] 2.4 Add a "Live Preview" of how the storefront will look with the chosen color.

## Phase 3: Dynamic Storefront
- [x] 3.1 Update `src/app/[slug]/page.tsx` to inject the `brand_color` via CSS variables.
- [x] 3.2 Add the contact information section to the storefront footer.
- [x] 3.3 Ensure the "Add to Cart" and "Checkout" buttons use the dynamic brand color.

## Phase 4: Verification
- [x] 4.1 Verify that color changes persist and apply instantly on the public link.
- [x] 4.2 Check contrast accessibility for common brand colors.
- [x] 4.3 Run final GGA, TSC, and Lint checks.

