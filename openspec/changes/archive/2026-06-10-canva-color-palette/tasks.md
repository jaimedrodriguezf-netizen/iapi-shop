Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

# Tasks: Canva Color Palette and Customization

This task breakdown outlines the implementation plan for database-backed predefined color palettes, settings customization, Free plan unlock, and storefront theme updates.

---

## Phase 1: Database Migration & Seeding
- [x] 1.1 Create Color Palettes Migration at `supabase/migrations/20260609000000_color_palettes.sql`
- [x] 1.2 Write Migration Unit Test at `supabase/migrations/20260609000000_color_palettes.test.ts`

## Phase 2: Server Actions & Page Wiring
- [x] 2.1 Add `getColorPalettes` Server Action in `src/lib/tenants/actions.ts`
- [x] 2.2 Remove Free Plan Restrictions in Settings Server Action in `src/lib/tenants/actions.ts`
- [x] 2.3 Fetch Color Palettes in Dashboard Settings Page at `src/app/dashboard/settings/page.tsx`

## Phase 3: Dashboard settings-form UI & Live Preview
- [x] 3.1 Extend SettingsForm Types and Validation in `src/components/dashboard/settings-form.tsx`
- [x] 3.2 Render Dynamic Predefined Palettes Grid in `src/components/dashboard/settings-form.tsx`
- [x] 3.3 Add Custom Secondary Color Picker in `src/components/dashboard/settings-form.tsx`
- [x] 3.4 Remove Free Plan Disables & Warning Banners in `src/components/dashboard/settings-form.tsx`
- [x] 3.5 Update Phone Simulation Live Preview in `src/components/dashboard/settings-form.tsx`

## Phase 4: Storefront Layout & Component Theme Styling
- [x] 4.1 Storefront Layout Theme Injection in `src/app/[slug]/page.tsx`
- [x] 4.2 Update Catalog Component Styles in `src/components/storefront/storefront-catalog.tsx`
- [x] 4.3 Update Cart Drawer Component Styles in `src/components/storefront/cart-drawer.tsx`

## Phase 5: Verification & Tests
- [x] 5.1 Update settings-form Unit Tests in `src/components/dashboard/settings-form.test.tsx`
- [x] 5.2 Execute test suites and verify builds
