# Design: Merchant Onboarding

## Technical Approach

The onboarding flow is already largely implemented in a single-pass approach: a `"use client"` form at `/onboarding` calls the `createTenant` server action, which handles all three inserts (tenant, member, subscription) sequentially. The middleware `proxy.ts` gates the route for authenticated users.

This design covers the **remaining gaps**: real-time slug availability check, success redirect to `/dashboard/[slug]` instead of `/dashboard`, E2E verification, and a minor form refactor to pass `whatsapp_phone` as a single field.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Slug availability endpoint | New server action `checkSlugAvailability(slug: string)` using `supabase.from("tenants").select("slug").eq("slug", slug)` | Edge Function, dedicated API route | Follows existing server-action pattern. RLS policies are bypassed via`select` on `tenants` which is low-risk. No new route needed. |
| Debounce for slug check | `useDebounce` custom hook with 400ms delay | `useDeferredValue`, on-blur only | Standard pattern, low cost. The supabase call is a single indexed `eq` query — fast enough for 400ms debounce. |
| Redirect on success | `router.push(`/dashboard/${result.data.slug}`)` | Server-side redirect (revalidatePath + redirect) | Client-side redirect is simpler. The `createTenant` action returns the slug in `data`. No need for `redirect()` from server action which has known issues with `"use server"`. |
| Auth gate for `/onboarding` | Already handled by `proxy.ts` + `isProtectedAppRoute`. No component-level check needed. | `middleware.ts` direct check, layout-level gate | Consistent with dashboard protection pattern. Single source of truth in `permissions.ts`. |
| Form fields refactor | Keep country_code + phone_number as separate form fields, combine into `whatsapp_phone` before calling action | Single input field with regex validation | UX decision: country code dropdown improves international UX. Already implemented. |
| E2E test structure | Single Playwright spec `onboarding.spec.ts` with 2 scenarios | Separate files per scenario | Small scope — single file keeps related tests together. Follows existing `admin-users-ui.spec.ts` convention. |

## Data Flow

```
  Browser                     Server Action                     Postgres (RLS)
  ───────                     ──────────────                    ───────────────
     │                             │                                  │
     │── checkSlugAvailability ──►│── SELECT slug FROM tenants ──────►│
     │◄── { available: true } ───│◄───── WHERE slug = ? ────────────◄│
     │                             │                                  │
     │── createTenant(input) ────►│── INSERT INTO tenants ───────────►│  ← RLS: `created_by = auth.uid()`
     │                             │── INSERT INTO tenant_members ────►│  ← RLS: `has_tenant_role(id, owner/admin)`
     │                             │── SELECT FROM plans WHERE free──►│  ← RLS: `is_active or platform_admin`
     │                             │── INSERT INTO tenant_subscriptions─►│  ← RLS: `has_tenant_role(tenant_id, owner)`
     │◄── { success, data } ──────│◄─────────────────────────────────◄│
     │                             │                                  │
     │── router.push(/dashboard/{slug})
```

> **Note**: The three inserts are sequential (not an atomic DB transaction). Task 3.2 (RLS verification) should validate that a failed member insert does not leave an orphan tenant. If this becomes a production issue, a DB function with `BEGIN/COMMIT` should wrap the three inserts — tracked as future improvement.

## File Changes

| File | Action | Status | Description |
|------|--------|--------|-------------|
| `src/lib/tenants/actions.ts` | Modify | ✅ Done | `createTenant` with auth, tenant-limit, multi-table insertion. Add `checkSlugAvailability`. |
| `src/lib/tenants/actions.test.ts` | Modify | ✅ Done | 4 unit tests for createTenant. Add slug availability test. |
| `src/hooks/use-debounce.ts` | Create | 🔲 Pending | Custom hook for debounced values (400ms) used by slug field. |
| `src/app/onboarding/page.tsx` | Modify | 🔲 Pending | Add slug availability indicator, fix redirect to `/dashboard/[slug]`, add loading state polish. |
| `e2e/onboarding.spec.ts` | Create | 🔲 Pending | Playwright E2E: login → onboarding → dashboard + RLS isolation test. |

## Interfaces

```typescript
// NEW: Slug availability action
export async function checkSlugAvailability(slug: string): Promise<{
  available: boolean;
  error?: string;
}>;

// NEW: Custom hook
function useDebounce<T>(value: T, delay: number): T;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `createTenant` auth, limit, success paths | Vitest with mocked Supabase client (existing pattern in `actions.test.ts`) |
| Unit | `checkSlugAvailability` available/taken/error | Vitest, mocked Supabase |
| Integration | Form submission → action → redirect | RTL + User Event (optional; Playwright covers this) |
| E2E | Login → fill onboarding → verify dashboard loads | Playwright `onboarding.spec.ts` |
| E2E | User B cannot access User A's tenant | Playwright with dual-auth scenario |

## Migration / Rollout

No migration required. All schema (tenants, members, plans, subscriptions) already exists from foundation migration `20260517011500_foundation_auth_rls.sql`. The `free` plan is already seeded.

## Open Questions

- [ ] Should the three inserts (tenant, member, subscription) be wrapped in a PostgreSQL function for atomicity? Current sequential approach works but leaves garbage on partial failure. → **Deferred**: track as follow-up improvement if production errors surface.
- [x] ~~Should the form use a single `whatsapp_phone` field or split country_code + phone_number?~~ → **Decided**: keep split fields (already implemented). Better UX.
