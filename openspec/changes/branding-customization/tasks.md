# Tasks: Branding & Personalization

## Phase 1: Database & Logic
- [ ] 1.1 Create migration to add `brand_color`, `secondary_color`, `address`, and `social_links` to `tenants`.
- [ ] 1.2 Implement `updateTenantSettings` server action in `src/lib/tenants/actions.ts`.
- [ ] 1.3 Add unit tests for settings updates.

## Phase 2: Settings Interface
- [ ] 2.1 Create `/dashboard/settings` page.
- [ ] 2.2 Implement a color picker component (or curated list) for `brand_color`.
- [ ] 2.3 Build the contact info and social links section with dynamic form fields.
- [ ] 2.4 Add a "Live Preview" of how the storefront will look with the chosen color.

## Phase 3: Dynamic Storefront
- [ ] 3.1 Update `src/app/[slug]/page.tsx` to inject the `brand_color` via CSS variables.
- [ ] 3.2 Add the contact information section to the storefront footer.
- [ ] 3.3 Ensure the "Add to Cart" and "Checkout" buttons use the dynamic brand color.

## Phase 4: Verification
- [ ] 4.1 Verify that color changes persist and apply instantly on the public link.
- [ ] 4.2 Check contrast accessibility for common brand colors.
- [ ] 4.3 Run final GGA, TSC, and Lint checks.
