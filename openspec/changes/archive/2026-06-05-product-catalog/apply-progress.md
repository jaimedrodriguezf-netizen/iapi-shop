# Apply Progress: Product Catalog

## Status: Complete

All 11 tasks implemented and verified.

## Files Changed

### New Files
- `supabase/migrations/20260531205000_product_catalog.sql` — Migration creating `categories`, `tags`, `products`, `product_images`, `product_tags` tables with RLS policies, indexes, and triggers
- `supabase/migrations/20260531205000_product_catalog.test.ts` — Migration structure tests (16 tests)
- `supabase/seed.sql` — Sample categories (Bebidas, Comidas, Postres, Snacks, Combos) for seed tenants

### Modified Files
- `src/lib/products/actions.ts` — Added `checkProductLimit()` guard function and integrated it into `createProduct()`; added `getTenantSubscription` import
- `src/lib/tenants/actions.ts` — Extended `TenantSubscription` interface to include `product_limit`; updated `getTenantSubscription()` to select `plans(name, product_limit)`
- `src/components/dashboard/product-form-modal.tsx` — Replaced description `Input` with `Textarea`; added working "Generar con IA" button that calls `generateProductDescription`; added `Sparkles`/`Loader2` icons; added `isGeneratingAI` state
- `src/components/dashboard/product-form-modal.test.tsx` — Added AI button tests: button exists, calls `generateProductDescription`, handles errors, disabled when name too short
- `src/lib/products/actions.test.ts` — Rewrote test file with proper per-test mock setup; added `checkProductLimit` tests (under limit, at limit); added `createProduct` plan-limit rejection test

## Implementation Details

### Task 1.1 — Migration
- Timestamp `20260531205000` runs BEFORE `20260531205500` (orders_analytics) which references `products(id)` as FK
- 5 tables: categories, tags, products, product_images, product_tags
- `product_images` and `product_tags` have `ON DELETE CASCADE` for automatic cleanup
- `categories` FK on products uses `ON DELETE SET NULL` (products survive category deletion)

### Task 1.2 — RLS Policies
- Direct tenant-bound policies on `categories`, `tags`, `products` using `has_tenant_role(tenant_id)`
- Junction/child tables (`product_images`, `product_tags`) use `EXISTS` subquery checking `products.tenant_id`
- Matches existing foundation RLS convention (`orders_select_member` pattern)

### Task 1.3 — Seeds
- 5 categories per active tenant: Bebidas, Comidas, Postres, Snacks, Combos
- Uses `ON CONFLICT (tenant_id, slug) DO NOTHING` for idempotency

### Task 2.1 — Categories CRUD
- Already existed: `createCategory()`, `getCategories()` in `src/lib/products/actions.ts`
- No changes needed

### Task 2.2 — Products CRUD
- Already existed: `createProduct()`, `getProducts()`, `updateProduct()`, `deleteProduct()`
- Added `checkProductLimit()` guard integrated into `createProduct()`
- Guard checks product count against `plans.product_limit`

### Task 2.3 — OpenAI Description Generation
- Already existed: `generateProductDescription()` in `src/lib/ai/actions.ts`
- Uses gpt-4o-mini, Spanish prompts, max 2 sentences, no hashtags
- No changes needed

### Task 3.1 — Products Page
- Already existed: `/dashboard/products/page.tsx` with DataTable
- No changes needed

### Task 3.2 — Add Product Dialog
- Already existed: `ProductFormModal` with zod validation
- No changes needed

### Task 3.3 — AI Button Wiring
- Replaced placeholder `Input` with `Textarea` for description
- Added `handleGenerateDescription()` that calls `generateProductDescription(name, categoryName)`
- Button shows loading state with `Loader2` spinner
- Disabled when name < 2 characters
- Toast notifications for success and error

### Task 4.1 — Tenant Isolation
- Verified via RLS policies using `has_tenant_role()` — all CRUD operations scoped to `tenant_id`
- `getProducts()` and `getCategories()` filter by `tenant_id`
- `updateProduct()` and `deleteProduct()` include `.eq("tenant_id", tenant_id)`

### Task 4.2 — Plan Limits
- `checkProductLimit()` queries product count and compares against `plans.product_limit`
- Returns `{ allowed, current, limit, error }` structured response
- Integrated as guard in `createProduct()` — rejects if `current >= limit`

## Test Results
- All 111 unit tests pass
- 16 migration structure tests pass
- AI description tests pass (2)
- Product action tests pass with plan-limit guard coverage
- Product form modal tests pass including AI button interaction