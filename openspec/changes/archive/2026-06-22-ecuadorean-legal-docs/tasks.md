# Tasks: Ecuadorean Legal Compliance Docs

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 18 |
| **Implementation phases** | 6 |
| **Total estimated changed lines** | ~1,750 (new: ~1,450, modified: ~300) |
| **New files** | 14 |
| **Modified files** | 8 |
| **PR recommendation** | **Feature Branch Chain** (3 chained PRs) |
| **400-line budget risk** | **High** — each PR exceeds 400 lines; content modules (pure Spanish text) are the bulk |
| **Decision needed** | Chained PR strategy confirmation |

## Design Decisions Carried Forward

- **Rate limiter**: `submitStoreReport` gets its own Upstash rate limiter (`reportRateLimit`: 3 reports per 15 min per IP) added to `src/lib/rate-limit.ts`
- **Admin reports location**: Extend the EXISTING `/dashboard/admin/review` page (add a reports section/tab); do NOT create `/dashboard/admin/reports`
- **Consent storage**: Columns on `tenant_members` (not a separate table)
- **Feature flag**: `LEGAL_LINKS_ENABLED` in `src/lib/legal/constants.ts`, default `true`

## Prerequisites

1. Run `npx vitest run` to confirm all existing tests pass before starting
2. Run `npx playwright test` to confirm all existing E2E tests pass before starting
3. Review the existing patterns in `src/lib/rate-limit.ts`, `src/lib/auth/actions.ts`, `src/lib/tenants/actions.ts` for consistency

---

## Phase 1: Database Schema & Constants

### Task 1.1 — Migration: Add consent columns + `store_reports` table (60 lines)

**Description**: Create `supabase/migrations/20260616_legal_compliance.sql` with:
- `ALTER TABLE site_settings ADD COLUMN legal_version text NOT NULL DEFAULT '1'`
- `ALTER TABLE tenant_members ADD COLUMN legal_accepted_version text, ADD COLUMN legal_accepted_at timestamptz`
- `CREATE TABLE store_reports` (id uuid PK, tenant_id FK → tenants, reporter_email, reason, details, status enum, moderator_notes, created_at, updated_at)
- RLS: `anon` INSERT, `authenticated` INSERT, admin-only SELECT/UPDATE via `is_platform_admin()`
- Idempotent: use IF NOT EXISTS / safe ALTER TABLE patterns

**Files**: `supabase/migrations/20260616_legal_compliance.sql` (new)
**Depends on**: None
**Test requirements**: Task 1.2
**TDD**: Write migration, verify with migration test

---

### Task 1.2 — Migration test file (70 lines)

**Description**: Create `supabase/migrations/20260616_legal_compliance.test.ts` with SQL-level tests:
- `site_settings` has `legal_version` column with default `'1'`
- `tenant_members` has `legal_accepted_version` (nullable text) and `legal_accepted_at` (nullable timestamptz)
- `store_reports` table has all required columns with correct types
- RLS: anon can INSERT, anon cannot SELECT, admin can SELECT
- Existing seed row in `site_settings` is preserved

**Files**: `supabase/migrations/20260616_legal_compliance.test.ts` (new)
**Depends on**: Task 1.1
**Test requirements**: Follow existing migration test pattern (e.g., `20260613_site_settings.test.ts`)

---

### Task 1.3 — Legal constants module + rate limiter (40 lines)

**Description**: Create `src/lib/legal/constants.ts` with:
```typescript
export const LEGAL_LINKS_ENABLED = true;
export const CURRENT_LEGAL_VERSION = "1";
export const REPORT_REASONS = [
  "Productos ilegales",
  "Estafa/fraude",
  "Contenido inapropiado",
  "Suplantación de identidad",
  "Otro",
] as const;
export type ReportReason = typeof REPORT_REASONS[number];
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";
```

Add `reportRateLimit` to `src/lib/rate-limit.ts`:
```typescript
export const reportRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "15 m"),
      prefix: "ratelimit:reports",
      analytics: true,
    })
  : createMockRatelimit();
```
Update `src/lib/rate-limit.test.ts` to verify the new export.

**Files**: `src/lib/legal/constants.ts` (new), `src/lib/rate-limit.ts` (modify +15 lines), `src/lib/rate-limit.test.ts` (modify +5 lines)
**Depends on**: None
**Test requirements**: Verify `reportRateLimit` is exported and has `limit` method

---

## Phase 2: Legal Pages (Static Content)

### Task 2.1 — Legal layout (25 lines)

**Description**: Create `src/app/legal/layout.tsx` with:
- Centered max-width container (`max-w-3xl mx-auto`)
- Prose typography styling with dark-mode support
- Consistent padding for mobile/desktop
- Metadata root for legal section

**Files**: `src/app/legal/layout.tsx` (new)
**Depends on**: None
**Test requirements**: Visual check — renders correctly on mobile/desktop, dark/light modes

---

### Task 2.2 — Dynamic `[slug]` route with metadata (45 lines)

**Description**: Create `src/app/legal/[slug]/page.tsx`:
- Dynamic route resolving `slug = "terminos"` → `TerminosContent` and `slug = "privacidad"` → `PrivacidadContent`
- Unknown slugs return `notFound()`
- `generateMetadata` returns appropriate `<title>` and `<meta description>` per slug:
  - `terminos`: "Términos y Condiciones | IAPI Shop"
  - `privacidad`: "Política de Privacidad | IAPI Shop"
- No `await` database calls (fully static per Spec 7.2)

**Files**: `src/app/legal/[slug]/page.tsx` (new)
**Depends on**: Task 2.1
**Test requirements**: `notFound()` for unknown slug, metadata check via view-source, no DB calls

---

### Task 2.3 — T&C content module (220 lines)

**Description**: Create `src/app/legal/content/terminos.tsx` with all 8 sections in Spanish per Spec 1.2:
1. **Objeto del Servicio** — SaaS platform for digital catalogs
2. **Declaración de Intermediación** — Neutral intermediary under LCE Arts. 54-55
3. **Canal de Venta (WhatsApp)** — P2P checkout outside platform control
4. **Exclusiones de Responsabilidad** — No liability for payments, shipping, product quality, catalog accuracy, disputes
5. **Obligaciones del Comerciante** — LODC compliance, Art. 45 withdrawal right
6. **Uso Aceptable y Suspensión** — Prohibited goods, account suspension
7. **Propiedad Intelectual** — Brand, software, codebase
8. **Ley Aplicable y Jurisdicción** — Quito, Ecuador

**Files**: `src/app/legal/content/terminos.tsx` (new)
**Depends on**: Task 2.2
**Test requirements**: All 8 sections visible, LCE Arts. 54-55 cited, LODC Art. 45 cited, Quito jurisdiction

---

### Task 2.4 — Privacy Policy content module (190 lines)

**Description**: Create `src/app/legal/content/privacidad.tsx` with all 7 sections in Spanish per Spec 1.3:
1. **Responsable del Tratamiento** — Januscore, RUC 1719623512001, soporte@januscore.pro, +593987274146, Quito
2. **Datos Recopilados** — Merchant vs visitor data distinction
3. **Finalidades del Tratamiento** — Account mgmt, analytics, security, communications
4. **Límite en la Recopilación** — Explicit disclaimer: no buyer checkout data stored
5. **Legitimación** — Consent + contract execution
6. **Derechos ARCO** — All four rights with soporte@januscore.pro
7. **Conservación de Datos** — Active account duration + legal retention

**Files**: `src/app/legal/content/privacidad.tsx` (new)
**Depends on**: Task 2.2
**Test requirements**: All 7 sections visible, RUC/email/phone displayed, buyer data disclaimer present, ARCO rights listed

---

## Phase 3: Consent Capture

### Task 3.1 — ConsentCheckbox reusable component (40 lines)

**Description**: Create `src/components/legal/consent-checkbox.tsx`:
```tsx
"use client";
// Checkbox with links to /legal/terminos and /legal/privacidad
// Props: checked, onChange, disabled
// Gated by LEGAL_LINKS_ENABLED
```

**Files**: `src/components/legal/consent-checkbox.tsx` (new)
**Depends on**: Task 1.3 (constants)
**Test requirements**: Checkbox state, links open in same tab, disabled prop works, hidden when flag is false

---

### Task 3.2 — Modify `AuthForm` for register consent (45 lines added)

**Description**: Modify `src/components/auth/auth-form.tsx`:
- Import and render `ConsentCheckbox` above the submit button when `isRegisterMode` is true
- Pass `accepted_legal_terms` as a hidden input or form field
- Submit button disabled until checkbox is checked
- Observe existing pattern: the form already has `fieldErrors` and captchaToken handling

**Test-first**: Write component test in `src/components/auth/auth-form.test.tsx`:
- Consent checkbox visible in register mode
- Checkbox hidden in login mode
- Submit disabled when unchecked
- Submit enabled when checked

**Files**: `src/components/auth/auth-form.tsx` (modify), `src/components/auth/auth-form.test.tsx` (extend)
**Depends on**: Task 3.1
**Test requirements**: Vitest component test for checkbox visibility and submit state

---

### Task 3.3 — Modify `register` action to validate + persist consent (30 lines added)

**Description**: Modify `src/lib/auth/actions.ts`:
- Read `accepted_legal_terms` from FormData in the `register` function
- Reject with `"Debes aceptar los términos..."` if missing or falsy
- On success, read `site_settings.legal_version` and update `tenant_members` row (the new user is registered but doesn't have a tenant yet — need to handle this)
- **Challenge**: The `register` action creates a Supabase auth user, but `tenant_members` is linked after onboarding. Two approaches:
  - **Option A (preferred)**: Wait until onboarding/tenant creation to persist consent (see Task 3.5). The `register` action only validates the checkbox was checked.
  - **Option B**: Create a `profiles` or `users` consent column. Rejected — too much scope.
  - **Decision**: `register` validates + passes `accepted_legal_terms: true` to the session/callback, but consent is actually persisted when `createTenant` or `ensureUserTenant` runs.

**Test-first**: Write failing tests before modifying:
- `register` returns error when `accepted_legal_terms` is missing
- `register` returns error when `accepted_legal_terms` is `"false"`
- `register` succeeds when `accepted_legal_terms` is `"true"`

**Files**: `src/lib/auth/actions.ts` (modify), `src/lib/auth/actions.test.ts` (extend +80 lines)
**Depends on**: Task 1.1 (migration must exist), Task 3.2 (AuthForm must send field)
**Test requirements**: Vitest — consent validation in register action

---

### Task 3.4 — Modify onboarding page for consent (35 lines added)

**Description**: Modify `src/app/onboarding/page.tsx`:
- Extend `formSchema` with `accepted_legal_terms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar los términos..." }) })`
- Add `ConsentCheckbox` above the submit button using react-hook-form's `FormField`
- Existing form already uses `react-hook-form` with `zodResolver` — follow same pattern

**Files**: `src/app/onboarding/page.tsx` (modify)
**Depends on**: Task 3.1, Task 1.3
**Test requirements**: Zod validation rejects without consent, form submits with consent

---

### Task 3.5 — Modify `createTenant` to persist consent (20 lines added)

**Description**: Modify `src/lib/tenants/actions.ts`:
- Accept `accepted_legal_terms?: boolean` in `CreateTenantInput` (or as additional parameter)
- In `createTenant`: after inserting `tenant_members` row, UPDATE that same row to set `legal_accepted_version = site_settings.legal_version` and `legal_accepted_at = now()`
- Read `site_settings` single-row table for `legal_version`

**Test-first**: Write failing tests before modifying:
- `createTenant` without consent succeeds but without consent columns set
- `createTenant` with consent persists `legal_accepted_version` and `legal_accepted_at`
- `createTenant` with consent sets version from `site_settings.legal_version`

**Files**: `src/lib/tenants/actions.ts` (modify), `src/lib/tenants/actions.test.ts` (extend +60 lines)
**Depends on**: Task 1.1 (migration), Task 3.4 (onboarding sends field)
**Test requirements**: Vitest — consent persistence on tenant creation

---

## Phase 4: Re-consent Flow

### Task 4.1 — `acceptLegalTerms` server action (40 lines)

**Description**: Create `src/lib/legal/actions.ts` with:
```typescript
export async function acceptLegalTerms(): Promise<ActionResult<{ version: string }>> {
  // 1. Auth check
  // 2. Read site_settings.legal_version
  // 3. Update tenant_members SET legal_accepted_version, legal_accepted_at = now()
  //    WHERE user_id = current user AND tenant_id IN (user's tenants)
  // 4. Return { success: true, data: { version } }
}
```

**Files**: `src/lib/legal/actions.ts` (new, first action)
**Depends on**: Task 1.1 (migration), Task 1.3 (constants)
**Test requirements**: Task 4.4

---

### Task 4.2 — `ReConsentBanner` component (85 lines)

**Description**: Create `src/components/legal/re-consent-banner.tsx`:
- Server component that reads `site_settings.legal_version` and compares with current user's `legal_accepted_version` from `tenant_members`
- If versions differ, renders a non-dismissible banner:
  - "Hemos actualizado nuestros Términos y Condiciones y Política de Privacidad. Debés aceptarlos nuevamente para continuar."
  - Link to `/legal/terminos`
  - "Aceptar" button that calls `acceptLegalTerms()` server action
- If versions match, renders nothing
- Dashboard content remains usable while banner is visible (nag pattern, not hard block)

**Files**: `src/components/legal/re-consent-banner.tsx` (new)
**Depends on**: Task 4.1, Task 1.3
**Test requirements**: Vitest — banner visible when version mismatch, hidden when match, "Aceptar" triggers action

---

### Task 4.3 — Wire `ReConsentBanner` into dashboard layout (15 lines added)

**Description**: Modify `src/app/dashboard/layout.tsx`:
- Import `ReConsentBanner` and render it at the top of the dashboard content area (above `{children}`)
- Only render for non-admin users (admins don't need to accept merchant legal terms)
- The banner is a server component that fetches data, so it integrates cleanly into the server layout

**Files**: `src/app/dashboard/layout.tsx` (modify)
**Depends on**: Task 4.2
**Test requirements**: Visual — banner appears on all dashboard routes, non-blocking

---

### Task 4.4 — Unit tests for legal actions (180 lines)

**Description**: Create `src/lib/legal/actions.test.ts` with Vitest tests:
- `acceptLegalTerms`:
  - Unauthenticated returns `{ success: false }`
  - Authenticated updates correct `tenant_members` row
  - Sets version from `site_settings.legal_version`
  - `legal_accepted_at` is a valid timestamptz
  - Concurrent calls are idempotent
- Follow existing mock patterns from `src/lib/auth/actions.test.ts` and `src/lib/tenants/actions.test.ts`

**Files**: `src/lib/legal/actions.test.ts` (new)
**Depends on**: Task 4.1
**Test requirements**: Must pass `npx vitest run` before Task 5 can begin

---

## Phase 5: Footer Links

### Task 5.1 — `LegalFooterLinks` reusable component (30 lines)

**Description**: Create `src/components/legal/legal-footer-links.tsx`:
```tsx
// Renders "Términos y Condiciones" → /legal/terminos and "Política de Privacidad" → /legal/privacidad
// Gated by LEGAL_LINKS_ENABLED
// Styled consistently with existing footer typography (small, muted text)
// Can render inline (for storefront) or in a column (for landing page footer)
```

**Files**: `src/components/legal/legal-footer-links.tsx` (new)
**Depends on**: Task 1.3 (constants), Phase 2 (legal pages exist)
**Test requirements**: Links render with correct hrefs, hidden when flag is false

---

### Task 5.2 — Add legal links to landing page footer (15 lines added)

**Description**: Modify `src/components/landing/marketplace-client.tsx`:
- Import `LegalFooterLinks` and add below the existing copyright text in the footer section
- Links styled consistently with "© 2026 IAPI Shop — Marketplace de tiendas ecuatorianas"

**Files**: `src/components/landing/marketplace-client.tsx` (modify)
**Depends on**: Task 5.1
**Test requirements**: Links visible on `/` footer, visible on mobile/desktop

---

### Task 5.3 — Add legal links + report button to storefront footer (40 lines added)

**Description**: Modify `src/app/[slug]/page.tsx`:
- Import `LegalFooterLinks` and add inline "Términos" and "Privacidad" links in the storefront footer (next to "Potenciado por IAPI Shop")
- Import and render "Denunciar tienda" button that opens `StoreReportDialog` (lazy-loaded)
- Both gated by `LEGAL_LINKS_ENABLED`

The footer currently shows:
```
© 2026 {tenant.name}. Todos los derechos reservados.
Potenciado por IAPI Shop
```

After modification:
```
© 2026 {tenant.name}. Todos los derechos reservados.
Términos | Privacidad | Denunciar tienda
Potenciado por IAPI Shop
```

**Files**: `src/app/[slug]/page.tsx` (modify)
**Depends on**: Task 5.1, Task 6.1, Task 6.2
**Test requirements**: Links visible on storefront, report button visible, both hidden with flag=false

---

## Phase 6: Store Reporting

### Task 6.1 — `submitStoreReport` server action (60 lines) ✅

**Description**: Add to `src/lib/legal/actions.ts`:
```typescript
export async function submitStoreReport(input: {
  tenant_id: string;
  reporter_email: string;
  reason: ReportReason;
  details: string;
}): Promise<ActionResult<{ id: string }>> {
  // 1. Rate limiting via reportRateLimit (3/15min per IP)
  // 2. Zod validation: email format, reason in REPORT_REASONS, details 1-2000 chars
  // 3. Sanitize: strip HTML from details, trim all strings
  // 4. Verify tenant exists (SELECT id FROM tenants WHERE id = input.tenant_id)
  // 5. INSERT into store_reports (reporter_email not linked to auth)
  // 6. Return { success: true, data: { id } }
}
```

**Files**: `src/lib/legal/actions.ts` (modify, add second action)
**Depends on**: Task 1.1 (migration), Task 1.3 (constants + rate limiter)
**Test requirements**: Task 6.6

---

### Task 6.2 — `StoreReportDialog` modal component (180 lines) ✅

**Description**: Create `src/components/legal/store-report-dialog.tsx`:
- "use client" component with dialog/modal using shadcn/ui Dialog
- Lazy-loadable via Next.js `dynamic` import
- Form fields:
  - `reporter_email` (email input, required)
  - `reason` (select dropdown with 5 ReportReason options, required)
  - `details` (textarea, required, max 2000 chars, with character counter)
- Submit triggers `submitStoreReport()` server action
- States: loading (submit disabled), success (toast + close), error (toast + stay open)
- HTML stripping before submission
- Props: `tenantId: string`, `open: boolean`, `onOpenChange: (open: boolean) => void`

**Files**: `src/components/legal/store-report-dialog.tsx` (new)
**Depends on**: Task 6.1
**Test requirements**: Vitest — form validation, submit states, email format check, max length enforcement

---

### Task 6.3 — Wire "Denunciar tienda" into storefront (10 lines added) ✅

**Description**: In `src/app/[slug]/page.tsx`, add the "Denunciar tienda" trigger button in the footer area. The button opens `StoreReportDialog` (lazy-loaded via dynamic import) with the tenant's ID.

This is implemented alongside Task 5.3. The button appears in the storefront footer as an inline link: "Denunciar tienda".

**Files**: `src/app/[slug]/page.tsx` (modify, combined with Task 5.3)
**Depends on**: Task 6.2
**Test requirements**: Button visible, opens dialog on click

---

### Task 6.4 — `getPendingReports` + `updateReportStatus` server actions (80 lines) ✅

**Description**: Add to `src/lib/legal/actions.ts`:
```typescript
export async function getPendingReports(): Promise<ActionResult<StoreReport[]>> {
  // 1. Auth check: is_platform_admin()
  // 2. SELECT * FROM store_reports WHERE status = 'pending' ORDER BY created_at DESC
  // 3. Return typed StoreReport array
}

export async function updateReportStatus(
  reportId: string, 
  status: ReportStatus,
  notes?: string
): Promise<ActionResult<void>> {
  // 1. Auth check: is_platform_admin()
  // 2. Zod validation of status enum
  // 3. UPDATE store_reports SET status, moderator_notes, updated_at
  // 4. Return void
}
```

**Files**: `src/lib/legal/actions.ts` (modify, add third and fourth actions)
**Depends on**: Task 1.1 (migration), Task 1.3
**Test requirements**: Task 6.6

---

### Task 6.5 — Extend admin review page with reports section (120 lines added) ✅

**Description**: Modify `src/app/dashboard/admin/review/page.tsx` to add a **Store Reports** tab/section alongside the existing product review section. The existing page is a client component reviewing marketplace products.

Changes:
- Add a tab switcher: "Productos" | "Reportes" (using shadcn/ui Tabs or simple state toggle)
- "Reportes" tab renders:
  - List of pending reports from `getPendingReports()`
  - Each row shows: reporter email, reason, details preview (truncated), created date
  - Status dropdown (pending → reviewed/actioned/dismissed) via server action `updateReportStatus()`
  - `moderator_notes` textarea for internal notes
- Guard: only admins can access (is_platform_admin check)

Design: Follow the existing review page pattern (Card, CardContent, badges, buttons).

**Files**: `src/app/dashboard/admin/review/page.tsx` (modify)
**Depends on**: Task 6.4
**Test requirements**: Non-admin redirected, admin sees pending reports, status change persists

---

### Task 6.6 — Unit tests for report server actions (250 lines) ✅

**Description**: Add to `src/lib/legal/actions.test.ts`:
- `submitStoreReport`:
  - Successful insert returns `{ success: true, data: { id } }`
  - HTML in details is stripped before storage
  - details > 2000 chars rejected
  - Invalid email rejected
  - Non-existent tenant returns error
  - Rate limit exceeded returns error
- `getPendingReports`:
  - Non-admin returns `{ success: false }`
  - Admin returns pending reports
- `updateReportStatus`:
  - Valid status change persists
  - Invalid status enum rejected
  - Non-admin rejected
  - moderator_notes persists correctly

**Files**: `src/lib/legal/actions.test.ts` (extend)
**Depends on**: Task 6.1, Task 6.4
**Test requirements**: Must pass `npx vitest run`

---

## Phase 7: E2E Tests

### Task 7.1 — E2E: Consent on registration (80 lines) ✅

**Description**: Create `e2e/legal-consent.spec.ts`:
- Navigate to `/register`
- Verify consent checkbox is visible and unchecked
- Verify submit button is disabled
- Check the checkbox → button becomes enabled
- Submit with valid credentials → verify redirect
- Test without checking checkbox → verify error message

**Files**: `e2e/legal-consent.spec.ts` (new)
**Depends on**: Phase 3 (consent capture)
**Test requirements**: Playwright — full consent flow on registration

---

### Task 7.2 — E2E: Store report flow (100 lines) ✅

**Description**: Create `e2e/store-report.spec.ts`:
- Navigate to a published storefront (e.g., `/mi-tienda-e2e`)
- Scroll to footer → "Denunciar tienda" visible
- Click "Denunciar tienda" → modal opens
- Fill form with test data → submit
- Verify success toast
- Verify admin can see the report in `/dashboard/admin/review` (reports tab)
- Verify admin can change status

**Files**: `e2e/store-report.spec.ts` (new)
**Depends on**: Phase 5, Phase 6
**Test requirements**: Playwright — full report submission and moderation flow

---

## Review Workload Forecast

### Line Count Breakdown

| Phase | New | Modified | Total |
|-------|-----|----------|-------|
| Phase 1: Migration + Constants | 130 | 20 | 150 |
| Phase 2: Legal Pages | 480 | 0 | 480 |
| Phase 3: Consent Capture | 40 | 130 | 170 |
| Phase 4: Re-consent Flow | 305 | 15 | 320 |
| Phase 5: Footer Links | 30 | 55 | 85 |
| Phase 6: Store Reporting | 430 | 120 | 550 |
| Phase 7: E2E Tests | 180 | 0 | 180 |
| **Total** | **~1,595** | **~340** | **~1,935** |

### Chained PR Split (Feature Branch Chain Recommended)

Since all parts must integrate before main (legal pages without consent links would be incomplete, reporting without DB migration would crash), **Feature Branch Chain** is the recommended strategy:

```
feat/legal-compliance (tracker branch, draft/no-merge)
 ├── PR #1 → feat/legal-compliance  (Foundation + Legal Pages)
 ├── PR #2 → feat/legal-compliance  (Consent + Re-consent + Footer Links)
 └── PR #3 → feat/legal-compliance  (Store Reporting + E2E)
```

#### PR #1: Foundation + Legal Pages (~630 lines)
- Tasks: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4
- Can be reviewed independently (pure content + schema, no behavioral code)
- **Risk**: Exceeds 400-line budget. Content modules (~410 lines) are pure Spanish legal text — essentially boilerplate copy. Recommend **size:exception** for content modules, or split content into a separate PR.

If the reviewer prefers to keep PRs under 400, split further:
- **PR #1a**: Migration + Constants (~150 lines)
- **PR #1b**: Legal Pages Layout + Route (~70 lines)
- **PR #1c**: T&C Content (~220 lines) — size:exception for content copy
- **PR #1d**: Privacy Content (~190 lines) — size:exception for content copy

#### PR #2: Consent + Re-consent + Footer Links (~575 lines)
- Tasks: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3
- Contains all behavioral code for consent
- **Split opportunity**: Separate into Consent (Tasks 3.x + 4.x) and Footer Links (5.x) for ~450 + ~85

#### PR #3: Store Reporting + E2E (~730 lines)
- Tasks: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2
- Largest phase; contains reporting actions, dialog, admin panel, and tests
- **Split opportunity**: Reporting actions + admin (Tasks 6.x) at ~550 lines, E2E (Tasks 7.x) at ~180 lines

### 400-Line Budget Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Content modules exceed 400 | **High** | Legal text is copy, not code — recommend `size:exception` |
| Store reporting actions + admin | **High** | Split into actions vs UI vs tests across 2 PRs |
| Feature works together | **Medium** | Feature Branch Chain prevents partial deploys |
| Migration tests pass | **Low** | Follow existing pattern in `20260613_*` migrations |

### Optimized Chain (6 PRs)

For maximum reviewer-friendliness while keeping each PR under 400:

| PR | Contents | Est. Lines | Depends On |
|----|----------|-----------|------------|
| **#1** | Migration + Constants + Rate limiter | ~150 | — |
| **#2** | Legal layout + [slug] route + T&C + Privacy | ~480 | #1 |
| **#3** | ConsentCheckbox + AuthForm + register action + onboarding + createTenant | ~200 | #1, #2 |
| **#4** | acceptLegalTerms + ReConsentBanner + dashboard layout + tests | ~320 | #1, #3 |
| **#5** | LegalFooterLinks + marketplace footer + storefront footer | ~85 | #2 |
| **#6** | All store reporting (actions + dialog + admin + E2E) | ~550 | #1, #2, #5 |

PR #2 and PR #6 still exceed 400. PR #2 can be split into route (70 lines) + content (two files at 410 lines — recommend size:exception since these are static Spanish text). PR #6 can split into actions+admin (300 lines) and dialog+E2E (250 lines).

## Decision Needed Before Apply

**Strategy**: Review the chain split above. Options:
1. **Feature Branch Chain (3 PRs)**: Merge all into `feat/legal-compliance` tracker, then to main. Accept size:exception for content modules.
2. **Stacked PRs (4 PRs)**: If content modules and tests can land independently, stack to main. PR #2 (legal pages) works alone; PR #3 (consent) needs PR #1 + PR #2; PR #4 (reporting) needs PR #1 but is UI-independent.
3. **Single PR (size:exception)**: Accept the full ~1,935 lines as one PR. Only if maintainer explicitly approves.

**Recommendation**: **Option 1 — Feature Branch Chain with 3 PRs.** Content modules get `size:exception` (they're copy, not code). This balances review load with feature coherence.

## Rollback Safeguard

Every UI touchpoint is gated by `LEGAL_LINKS_ENABLED`. Setting it to `false` and redeploying hides footer links, report button, and consent checkbox. Legal pages at `/legal/*` remain accessible (bookmarked URLs don't break). The DB migration is backward-compatible (nullable columns, no destructive changes).
