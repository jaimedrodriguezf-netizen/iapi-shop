# Tasks: Product Catalog

## Phase 1: Database & Security
- [x] 1.1 Create migration for `categories` and `products` tables.
- [x] 1.2 Implement RLS policies for products/categories (tenant-bound).
- [x] 1.3 Add sample categories to the `seeds`.

## Phase 2: Logic (TDD)
- [x] 2.1 Create Server Actions for categories CRUD.
- [x] 2.2 Create Server Actions for products CRUD.
- [x] 2.3 Implement OpenAI service for description generation.

## Phase 3: Dashboard UI
- [x] 3.1 Create `/dashboard/products` page with `DataTable`.
- [x] 3.2 Implement "Add Product" dialog with validation.
- [x] 3.3 Connect AI generation button to the form.

## Phase 4: Verification
- [x] 4.1 Verify tenant isolation (User A cannot see User B products).
- [x] 4.2 Verify plan limits (e.g., Free plan only allows 10 products).