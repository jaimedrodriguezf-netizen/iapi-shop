# Design: Product Catalog

## Technical Approach

The change is **mostly implemented**: server actions (`src/lib/products/actions.ts`), dashboard UI (`product-list-client.tsx`, `product-form-modal.tsx`), and the `/dashboard/products` page already exist with tests. Remaining work: **database migration**, **RLS policies**, **AI button wiring**, and **plan limit enforcement**.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration timestamp | `< 20260531205500` (e.g. `20260531205000`) | `orders_analytics` migration already references `public.products(id)` as FK. New migration MUST run first. |
| RLS policy pattern | `has_tenant_role(tenant_id)` for select/update/delete; `auth.uid()`-scoped for insert | Matches existing foundation RLS conventions (see `orders_select_member`) |
| Plan limit enforcement | Server-action guard: count products → compare against `plans.product_limit` | Simple, testable, no stored-procedure complexity needed |
| AI button integration | Client-side call to existing `generateProductDescription` server action | Action already tested and imports OpenAI SDK. No new backend needed. |
| Slug auto-generation | Client passes name; server lowercases + replaces spaces/special chars with hyphens | Already implemented in `createProduct`/`updateProduct` — no change needed |
| Image upload | Supabase Storage with base64 fallback | Already implemented in `uploadProductImage` — no change needed |
| Cascade deletes | `ON DELETE CASCADE` on `product_images`, `product_tags` FK to `products` | Simplifies cleanup; no orphan rows |

## Data Flow

```
Merchant UI                   Server Actions                  Supabase
──────────                    ───────────────                 ────────
ProductFormModal ──create/update──> actions.ts ──insert──> products
     │                                 │                    product_images
     │                                 │                    product_tags
     └──"Generate IA"──> ai/actions.ts ──OpenAI──> description
                              │
                              └──count check──> plans.product_limit
                                    │
                                    └──REJECT if over limit

Dashboard/page.tsx ──getMyTenant()──> tenant_id
     └──getTenantSubscription──> plan_name
                                     │
ProductListClient ──getProducts(tenant_id)──> products + categories.name + image_urls
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260531205000_product_catalog.sql` | **Create** | `categories`, `products`, `product_images`, `product_tags`, `tags` tables + RLS + indexes |
| `supabase/migrations/20260531205000_product_catalog.test.ts` | **Create** | Migration structure tests |
| `supabase/seed.sql` | **Create** | Sample categories (Bebidas, Comidas, Postres) per seed tenant |
| `src/lib/products/actions.ts` | **Modify** | Add `checkProductLimit(tenant_id)` guard in `createProduct` |
| `src/lib/tenants/actions.ts` | **Modify** | Extend `getTenantSubscription` to include `plans.product_limit` |
| `src/components/dashboard/product-form-modal.tsx` | **Modify** | Replace description `Input` with `Textarea`, add working "Generate with IA" button (remove placeholder text) |

## Interfaces / Contracts

```typescript
// New: plan limit check (in products/actions.ts)
async function checkProductLimit(tenant_id: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  error?: string;
}>

// Modified: TenantSubscription (tenants/actions.ts)
export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plans: {
    name: string;
    product_limit: number;     // NEW
  } | null;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Migration | Tables, RLS, indexes exist | `vitest` assertions on SQL file content (follow `orders_analytics.test.ts` pattern) |
| Unit (actions) | CRUD, slug gen, plan limit guard, AI generation | Already covered in `products/actions.test.ts` and `ai/actions.test.ts`; add plan-limit test cases |
| Component | Form validation, AI button wiring | Existing `product-form-modal.test.tsx`; add AI button interaction test |
| E2E | Tenant isolation (Task 4.1) | Playwright: login as two tenants, verify products don't leak |

## Migration / Rollout

- Run `supabase db push` to apply new migration (timestamped before orders_analytics to satisfy FK)
- If orders_analytics migration already applied and products table missing, manually create products table first, then run new migration
- No data migration required — greenfield tables

## Open Questions

- [ ] Does the `products` table already exist in the Supabase instance? (orders migration has FK to it). If yes, 1.1 reduces to verifying consistency.
- [ ] Should plan limits be checked via a DB function (`check_plan_limit`) or app-side count? Design defaults to app-side for simplicity.
