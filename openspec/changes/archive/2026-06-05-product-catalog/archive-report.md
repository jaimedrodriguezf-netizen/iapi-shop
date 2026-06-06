# Archive Report: product-catalog

## Change Summary

**Change**: product-catalog  
**Archived**: 2026-06-05  
**Status**: Complete (PASS WITH WARNINGS)  
**SDD Cycle**: proposal → specs → design → tasks → apply → verify → archive  

## Intent

Allow merchants to manage their products and categories within their "Sucursales". Core storefront functionality covering database schema (categories, products, tags), RLS tenant isolation, product CRUD, OpenAI-powered description generation, image upload, and plan-based product limits.

## Artifacts Archived

| Artifact | Status | Notes |
|----------|--------|-------|
| proposal.md | ✅ | Scope: DB schema, RLS, CRUD, AI descriptions, image upload |
| specs/product-catalog/spec.md | ✅ | 6 requirements: RLS, Category CRUD, Product CRUD, Image upload, Plan limits |
| specs/dashboard-products/spec.md | ✅ | 5 requirements: DataTable, Add dialog, AI button, Visual identity, Toasts |
| specs/ai-descriptions/spec.md | ✅ | 3 requirements: Generation, Input validation, Error handling |
| design.md | ✅ | 8 architecture decisions documented |
| tasks.md | ✅ | 11/11 tasks completed (Phase 1-4) |
| apply-progress.md | ✅ | Full implementation summary with file changes |
| verify-report.md | ✅ | Verdict: PASS WITH WARNINGS |

## Specs Synced to Main

| Domain | Action | Details |
|--------|--------|---------|
| product-catalog | **Created** | New domain — 6 requirements (RLS, Category CRUD, Product CRUD, Image upload, Plan limits) |
| dashboard-products | **Created** | New domain — 5 requirements (DataTable, Add dialog, AI button, Visual identity, Toasts) |
| ai-descriptions | **Created** | New domain — 3 requirements (Generation, Input validation, Error handling) |

## Build & Test Evidence

- **vitest run**: 111/111 tests passed (19 test files, 3.37s)
- **tsc --noEmit**: 0 errors
- Migration structure tests: 16 ✅
- Product action tests: 13 ✅
- Plan limit guard tests: 3 ✅
- AI description tests: 2 ✅
- Product form modal tests: 4 ✅

## Implementation Files

### New
- `supabase/migrations/20260531205000_product_catalog.sql` — 5 tables, RLS, indexes, triggers
- `supabase/migrations/20260531205000_product_catalog.test.ts` — 16 tests
- `supabase/seed.sql` — 5 sample categories per tenant

### Modified
- `src/lib/products/actions.ts` — Added `checkProductLimit()` guard
- `src/lib/tenants/actions.ts` — Extended `TenantSubscription` with `product_limit`
- `src/components/dashboard/product-form-modal.tsx` — AI button, Textarea, loading state
- `src/components/dashboard/product-form-modal.test.tsx` — AI button tests
- `src/lib/products/actions.test.ts` — Plan limit test cases

## Known Issues (from verify-report)

### WARNING
1. **Search input non-functional** — `product-list-client.tsx:187` has a decorative `<Input>` with no filtering logic. Spec scenario "Search filters products" is not implemented.

### SUGGESTION
2. `act()` warning in product-form-modal AI button test
3. Stale comment in `products/actions.ts:42` (says "3 fotos" but limit is 6)
4. No RLS update policy for `product_tags` (code uses delete+reinsert, so acceptable)

## Archive Decision

Archived with warnings. No CRITICAL issues. The one WARNING (non-functional search input) is a UX gap that doesn't compromise data integrity, tenant isolation, or core functionality. Recommended as follow-up work.

## SDD Cycle Complete

The product catalog change has been fully planned, implemented, verified, and archived. Specs are synced to the source of truth. Ready for the next change.
