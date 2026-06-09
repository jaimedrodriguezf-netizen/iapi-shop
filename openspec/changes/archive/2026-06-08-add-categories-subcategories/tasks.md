# Tasks: Add Categories and Subcategories (3 Levels)

## Phase 1: Database Migration
- [x] Create `supabase/migrations/20260608000000_categories_subcategories.sql` adding `parent_id` to `categories` table.
- [x] Create SQL test file `supabase/migrations/20260608000000_categories_subcategories.test.ts` to verify database structure.
- [x] Run migration tests using `npm run test` or check local migrations.

## Phase 2: Actions & Server-side Logic
- [x] Update `Category` interface in `src/lib/products/actions.ts` to include optional `parent_id`.
- [x] Update `createCategory` server action in `src/lib/products/actions.ts` to accept `parent_id` and insert it.
- [x] Update unit tests in `src/lib/products/actions.test.ts` to cover subcategory and third-level category creation and relationships.

## Phase 3: Dashboard Product Form UI
- [x] Update `ProductFormModal` in `src/components/dashboard/product-form-modal.tsx` to handle cascading selects for Category Level 1, Level 2, and Level 3.
- [x] Update product initial value loading to resolve hierarchical levels from the product's `category_id`.
- [x] Update the category creation UI in `ProductFormModal` to support setting a parent category (optional, up to Level 2).
- [x] Update `ProductFormModal` unit tests in `src/components/dashboard/product-form-modal.test.tsx` to cover the new selector behavior.

## Phase 4: Storefront & Catalog Filter
- [x] Update `StorefrontCatalog` in `src/components/storefront/storefront-catalog.tsx` to display secondary pills for Level 2 subcategories and tertiary tags for Level 3 subcategories.
- [x] Update the product filtration algorithm in `StorefrontCatalog` to recursively include products from all sub-levels when a parent category is selected.
- [x] Verify storefront filtering unit tests or update them to reflect the hierarchical selection.

## Phase 5: Verification & Quality Assurance
- [x] Run full typecheck: `npx tsc --noEmit`.
- [x] Run linter: `npm run lint`.
- [x] Run tests: `npm run test`.
- [x] Verify build compiles cleanly: `npm run build`.
