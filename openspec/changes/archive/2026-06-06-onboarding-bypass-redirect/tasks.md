# Tasks: onboarding-bypass-redirect

## Review Workload Forecast
- Estimated changed lines: 300 lines
- 400-line budget risk: Low
- Chained PRs recommended: No
- Delivery strategy: ask-on-risk
- Decision needed before apply: No
- Chain strategy: none

## Implementation Tasks

### Phase 1: Database Actions & API Utilities
- [x] Implement `ensureUserTenant()` in `src/lib/tenants/actions.ts` to check/auto-provision a tenant in "draft" status.
- [x] Update `updateTenantSettings()` input schema and server action in `src/lib/tenants/actions.ts` to allow changing `name`, `slug`, and `status`.
- [x] Implement slug uniqueness check and publishing rules validation (cannot publish with "Mi Tienda" name or default "tienda-" slug) in `updateTenantSettings()`.
- [x] Modify `getStorefrontData()` in `src/lib/storefront/actions.ts` to allow fetching draft stores so they can be parsed by the public route.

### Phase 2: Dashboard Views Integration
- [x] Modify `src/app/dashboard/page.tsx` to call `ensureUserTenant()` for non-admin roles and set the current tenant.
- [x] Replace `getMyTenant()` with `ensureUserTenant()` in `src/app/dashboard/products/page.tsx`.
- [x] Replace `getMyTenant()` with `ensureUserTenant()` in `src/app/dashboard/orders/page.tsx`.
- [x] Replace `getMyTenant()` with `ensureUserTenant()` in `src/app/dashboard/qr/page.tsx`.
- [x] Replace `getMyTenant()` with `ensureUserTenant()` in `src/app/dashboard/settings/page.tsx`.

### Phase 3: Settings Form UI
- [x] Update `brandingSchema` validation in `src/components/dashboard/settings-form.tsx` to validate `name`, `slug`, and `status`.
- [x] Add Store Name, Slug fields, and a "Publicar Tienda" status toggle switch to the settings form in `src/components/dashboard/settings-form.tsx`.
- [x] Watch Name and Slug in the form; if default name or default slug prefix is detected, disable the toggle and force status to `draft` with a visual warning alert.
- [x] Wire the settings form submission to call `updateTenantSettings()`.

### Phase 4: Public Storefront Integration
- [x] Update `src/app/[slug]/page.tsx` to handle the tenant's `draft` status.
- [x] If status is `draft`, render the "under construction" card instead of the public storefront catalog.

### Phase 5: Verification & Tests
- [x] Write Vitest unit tests in `src/lib/tenants/actions.test.ts` to verify `ensureUserTenant()` logic (database inserts, defaults, and no-op when tenant exists).
- [x] Write Vitest unit tests in `src/components/dashboard/settings-form.test.tsx` to verify the settings form validation and auto-draft reset behavior.
- [x] Create a Playwright E2E test in `tests/storefront-draft.spec.ts` (implemented in `e2e/storefront-draft.spec.ts` per playwright config) to verify the draft state storefront redirect/blocking behavior.
