# Apply Progress: Merchant Onboarding

## Status: ✅ Complete

## Tasks Completed

### Phase 1: Logic & Validation (TDD)

**1.1** — `createTenant` action and tests already existed (per design doc, marked ✅ Done). No changes needed.

**1.2** — `createTenant` action already implemented with auth check, tenant-limit enforcement, and multi-table insertion. No changes needed.

**1.3** — Added `checkSlugAvailability` server action to `src/lib/tenants/actions.ts`:
- Server-side slug format validation (regex + length check)
- Authenticated user check before querying
- Supabase query against `tenants` table with `eq("slug", slug).limit(1)`
- Returns `{ available: boolean; error?: string }`

Added 7 new unit tests to `src/lib/tenants/actions.test.ts`:
- Slug available (returns `available: true`)
- Slug taken (returns `available: false`)
- Invalid slug: uppercase chars
- Invalid slug: underscores
- Slug too short (< 2 chars)
- Slug too long (> 60 chars)
- Unauthenticated user rejected

All 11 tests pass.

### Phase 2: UI Implementation

**2.1** — `/onboarding` page already existed with shadcn/ui form. Enhanced with slug availability UI.

**2.2** — Real-time slug availability check:
- Created `src/hooks/use-debounce.ts` — custom `useDebounce` hook (400ms delay)
- Added `SlugAvailability` state type with states: `idle | checking | available | taken | error`
- Slug field shows: green ✓ check icon when available, red ✗ icon when taken, spinner while checking
- Debounced effect watches slug changes and calls `checkSlugAvailability`
- Submit button disabled when slug is taken or checking

**2.3** — Connected form to `createTenant` with improved loading states:
- Added `isSubmitting` state for explicit loading control
- Submit button shows `Loader2` spinner icon during submission
- **Fixed redirect**: Changed `router.push('/dashboard')` → `router.push('/dashboard/${result.data.slug}')` per design requirement
- Submit disabled when slug is taken or checking
- Uses `sonner` toast for success/error feedback

### Phase 3: Verification

**3.1** — Created `e2e/onboarding.spec.ts` with Playwright E2E test:
- Login → Onboarding → Dashboard redirect test
- Real-time slug availability UI test ("Ya está en uso" indicator)
- Unauthenticated redirect to `/login` test

**3.2** — RLS isolation test:
- Added RLS verification scenario testing that User A cannot access User B's tenant data via URL manipulation
- RLS is enforced at the database level; the E2E test validates the UI doesn't leak cross-tenant data

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/lib/tenants/actions.ts` | Modified | Added `checkSlugAvailability` action |
| `src/lib/tenants/actions.test.ts` | Modified | Added 7 slug availability unit tests, import for `checkSlugAvailability` |
| `src/hooks/use-debounce.ts` | Created | Custom `useDebounce` hook with 400ms default |
| `src/app/onboarding/page.tsx` | Modified | Slug availability UI, redirect fix `/dashboard/[slug]`, loading states |
| `e2e/onboarding.spec.ts` | Created | Playwright E2E: onboarding flow, slug check, auth redirect, RLS |
| `openspec/changes/merchant-onboarding/tasks.md` | Updated | All 8 tasks marked complete |
| `openspec/changes/merchant-onboarding/apply-progress.md` | Created | This file |

## Design Decisions Applied

- Slug availability: server action (not Edge Function) — follows existing pattern
- Debounce: 400ms custom hook — standard pattern
- Redirect: client-side `router.push(/dashboard/${slug})` — simpler than server redirect
- Auth gate: already handled by `proxy.ts` — no component-level check needed
- Form fields: kept split country_code + phone_number — better UX per design decision