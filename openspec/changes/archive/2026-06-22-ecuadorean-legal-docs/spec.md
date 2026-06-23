# Spec: Ecuadorean Legal Compliance Docs

## 1. Legal Pages Rendering

### Scenario 1.1: T&C page renders at `/legal/terminos`

**Given** a user navigates to `/legal/terminos`
**When** the page loads
**Then** the server renders a full-page layout with the IAPI Shop header and a structured Spanish T&C document

**Requirements:**
- Route: `src/app/legal/[slug]/page.tsx` — dynamic route that resolves `slug = "terminos"` or `"privacidad"`
- Content modules live in `src/app/legal/content/terminos.tsx` and `src/app/legal/content/privacidad.tsx`
- Unknown slugs return `notFound()`
- Layout (`src/app/legal/layout.tsx`) wraps all legal pages with consistent styling: centered max-width container, prose typography, dark-mode support

**Acceptance Criteria:**
- [ ] `/legal/terminos` returns HTTP 200 with visible heading "Términos y Condiciones"
- [ ] `/legal/privacidad` returns HTTP 200 with visible heading "Política de Privacidad"
- [ ] `/legal/no-existe` returns HTTP 404
- [ ] Both pages pass Lighthouse accessibility score ≥ 90
- [ ] Content is server-rendered (no client-side fetch for text)

### Scenario 1.2: T&C content covers Ecuadorian legal framework

**Given** the T&C page at `/legal/terminos`
**When** a user reads the document
**Then** it contains all mandatory sections per LCE, LODC, and LOPDP

**Requirements:**
The T&C document must include these sections (in Spanish):
1. **Objeto del Servicio** — IAPI Shop as a technology platform for digital catalogs (SaaS)
2. **Declaración de Intermediación** — Platform is a neutral intermediary under LCE Arts. 54-55; no commissions, no transaction processing
3. **Canal de Venta (WhatsApp)** — Orders go P2P via WhatsApp; outside IAPI Shop control
4. **Exclusiones de Responsabilidad** — No liability for: payments, shipping, product quality, catalog accuracy, merchant-buyer disputes
5. **Obligaciones del Comerciante** — Merchants must comply with LODC (truthful descriptions, quality, 3-day withdrawal right per Art. 45)
6. **Uso Aceptable y Suspensión** — Prohibited goods (drugs, weapons, copyrighted material); account suspension rights
7. **Propiedad Intelectual** — Platform brand, software, codebase protection
8. **Ley Aplicable y Jurisdicción** — Republic of Ecuador laws; courts of Quito

**Acceptance Criteria:**
- [ ] All 8 sections are present and visible on the page
- [ ] Section "Declaración de Intermediación" explicitly cites LCE Arts. 54-55 safe harbor
- [ ] Section "Obligaciones del Comerciante" references LODC Art. 45 (3-day withdrawal right)
- [ ] Section "Ley Aplicable" specifies Quito, Ecuador as jurisdiction

### Scenario 1.3: Privacy Policy content covers LOPDP requirements

**Given** the Privacy Policy page at `/legal/privacidad`
**When** a user reads the document
**Then** it contains all mandatory sections per LOPDP

**Requirements:**
The Privacy Policy must include these sections (in Spanish):
1. **Responsable del Tratamiento** — IAPI Shop operator identity:
   - Legal name: Januscore
   - RUC: 1719623512001
   - Email: soporte@januscore.pro
   - Phone: +593987274146
   - Domicilio: Quito, Ecuador
2. **Datos Recopilados** — Merchant data (email, store details) vs visitor data (cookies, IP)
3. **Finalidades del Tratamiento** — Account management, analytics, security, communications
4. **Límite en la Recopilación** — Explicit disclaimer: IAPI Shop does NOT collect buyer checkout data sent via WhatsApp
5. **Legitimación** — Consent (signup) + contract execution (dashboard service)
6. **Derechos ARCO** — Access, rectification, deletion, opposition via soporte@januscore.pro
7. **Conservación de Datos** — Duration: while account active + Ecuadorean legal retention requirements

**Acceptance Criteria:**
- [ ] All 7 sections present and visible
- [ ] Section "Responsable del Tratamiento" displays RUC 1719623512001, email soporte@januscore.pro, phone +593987274146, Quito Ecuador
- [ ] Section "Límite en la Recopilación" explicitly states IAPI Shop does not store buyer names, addresses, or payment details
- [ ] Section "Derechos ARCO" lists all four rights (Acceso, Rectificación, Cancelación, Oposición) with contact email

---

## 2. Consent Capture

### Scenario 2.1: Registration requires explicit consent checkbox

**Given** a user is on `/register`
**When** they attempt to create an account
**Then** they must check a consent checkbox before the form can submit

**Requirements:**
- Add a checkbox to `AuthForm` component (visible only in register mode) with label:
  > "Acepto los [Términos y Condiciones](/legal/terminos) y la [Política de Privacidad](/legal/privacidad) de IAPI Shop."
- Checkbox is unchecked by default
- Submit button is disabled until checkbox is checked
- On submit, the `register` server action receives `accepted_legal_terms: true` in FormData
- The `register` action rejects if `accepted_legal_terms` is missing or falsy
- Consent is persisted: `tenant_members.legal_accepted_version` (text) + `tenant_members.legal_accepted_at` (timestamptz)
- Version value comes from `site_settings.legal_version` (default: `"1"`)

**Acceptance Criteria:**
- [ ] Checkbox is visible and unchecked on page load at `/register`
- [ ] Submit button is disabled when checkbox is unchecked
- [ ] Checking the box enables the submit button
- [ ] Links to `/legal/terminos` and `/legal/privacidad` open in same tab
- [ ] Server action returns `{ success: false, error: "Debes aceptar los términos..." }` if checkbox not checked
- [ ] After successful registration, `tenant_members` row has `legal_accepted_version` and `legal_accepted_at` populated

### Scenario 2.2: Onboarding requires explicit consent checkbox

**Given** a registered user is on `/onboarding` creating their first store
**When** they submit the onboarding form
**Then** they must check a consent checkbox before tenant creation

**Requirements:**
- Add a checkbox above the submit button in `OnboardingPage` with the same label as Scenario 2.1
- Zod schema extended with `accepted_legal_terms: z.literal(true)`
- `createTenant` server action rejects if consent not provided
- On success, the new `tenant_members` row (owner role) stores `legal_accepted_version` and `legal_accepted_at`

**Acceptance Criteria:**
- [ ] Checkbox visible and unchecked on `/onboarding` page load
- [ ] Form submission blocked (zod validation error) if checkbox unchecked
- [ ] After tenant creation, owner's `tenant_members` record has consent fields populated
- [ ] Existing `createTenant` success path unchanged when consent is provided

---

## 3. Re-consent Flow

### Scenario 3.1: Re-consent banner appears when legal version changes

**Given** a merchant has previously accepted legal terms at version `"1"`
**When** an admin updates `site_settings.legal_version` to `"2"`
**Then** the merchant sees a persistent re-consent banner on their dashboard

**Requirements:**
- Add `legal_version` column to `site_settings` (text, default `"1"`)
- Dashboard layout (`src/app/dashboard/layout.tsx` or settings page) checks current user's `legal_accepted_version` against `site_settings.legal_version`
- If versions differ, render a non-dismissible banner at the top of the dashboard with:
  - Message: "Hemos actualizado nuestros Términos y Condiciones y Política de Privacidad. Debés aceptarlos nuevamente para continuar."
  - Link to review changes at `/legal/terminos`
  - "Aceptar" button that calls a server action to update `legal_accepted_version` and `legal_accepted_at`
- Banner persists across all dashboard routes until re-accepted
- Dashboard pages remain accessible (nag pattern, not hard block)

**Acceptance Criteria:**
- [ ] `site_settings` table has `legal_version` column with default `"1"`
- [ ] Merchant with `legal_accepted_version = "1"` sees no banner when `site_settings.legal_version = "1"`
- [ ] Merchant with `legal_accepted_version = "1"` sees banner when `site_settings.legal_version = "2"`
- [ ] Clicking "Aceptar" updates `tenant_members.legal_accepted_version` to `"2"` and banner disappears
- [ ] Banner appears on every dashboard route until re-accepted
- [ ] Dashboard content remains usable while banner is visible

### Scenario 3.2: Re-consent server action validates and persists

**Given** a logged-in merchant clicks "Aceptar" on the re-consent banner
**When** the server action executes
**Then** it updates their consent record atomically

**Requirements:**
- Server action `acceptLegalTerms()` in `src/lib/legal/actions.ts`
- Reads current `site_settings.legal_version`
- Updates `tenant_members` row for the authenticated user's active tenant
- Sets `legal_accepted_version = site_settings.legal_version` and `legal_accepted_at = now()`
- Returns `{ success: true }` or `{ success: false, error: string }`
- Requires authentication; rejects for unauthenticated users

**Acceptance Criteria:**
- [ ] Unauthenticated call returns `{ success: false }`
- [ ] Authenticated call updates the correct `tenant_members` row (tenant-scoped)
- [ ] `legal_accepted_at` is a valid timestamptz
- [ ] Concurrent calls are idempotent (no duplicate rows or errors)

---

## 4. Footer Links

### Scenario 4.1: Landing page footer includes legal links

**Given** a visitor is on the marketplace landing page (`/`)
**When** they scroll to the footer
**Then** they see links to Terms and Privacy Policy

**Requirements:**
- Add legal links section to the landing page footer (inside `MarketplacePage` or its client wrapper)
- Links: "Términos y Condiciones" → `/legal/terminos`, "Política de Privacidad" → `/legal/privacidad`
- Links styled consistently with existing footer typography (small, muted)
- Feature-flag constant `LEGAL_LINKS_ENABLED` (default `true`) controls visibility for rollback

**Acceptance Criteria:**
- [ ] Footer on `/` contains both legal links with correct hrefs
- [ ] Links are visible on mobile and desktop viewports
- [ ] Setting `LEGAL_LINKS_ENABLED = false` removes both links from the footer

### Scenario 4.2: Storefront footer includes legal links

**Given** a visitor is on any storefront page (`/[slug]`)
**When** they scroll to the footer
**Then** they see links to Terms and Privacy Policy alongside the existing "Potenciado por IAPI Shop" text

**Requirements:**
- Modify storefront footer in `src/app/[slug]/page.tsx`
- Add inline links: "Términos" and "Privacidad" next to the existing copyright text
- Same `LEGAL_LINKS_ENABLED` feature flag

**Acceptance Criteria:**
- [ ] Footer on `/mi-tienda` (or any valid slug) shows "Términos" → `/legal/terminos` and "Privacidad" → `/legal/privacidad`
- [ ] Links work on both light and dark mode
- [ ] Feature flag removal hides links without breaking footer layout

---

## 5. Store Reporting ("Denunciar tienda")

### Scenario 5.1: Storefront displays "Denunciar tienda" button

**Given** a visitor is viewing a storefront at `/[slug]`
**When** they look at the footer area
**Then** they see a "Denunciar tienda" link or button

**Requirements:**
- Add a "Denunciar tienda" button/link in the storefront footer
- Opens a modal dialog (`StoreReportDialog` component) with a form
- Form fields:
  - `reporter_email` (email, required) — for follow-up
  - `reason` (select, required) — categories: "Productos ilegales", "Estafa/fraude", "Contenido inapropiado", "Suplantación de identidad", "Otro"
  - `details` (textarea, required, max 2000 chars) — free-text description
- Submit calls server action `submitStoreReport()`
- `LEGAL_LINKS_ENABLED` flag also gates this feature (same rollback path)

**Acceptance Criteria:**
- [ ] "Denunciar tienda" button visible in storefront footer
- [ ] Clicking opens a modal with the form described above
- [ ] Form validates all fields (email format, reason selected, details non-empty, max length)
- [ ] Submit disabled while processing; shows loading state
- [ ] Success toast on submission; modal closes
- [ ] Error toast on failure; modal stays open with error message

### Scenario 5.2: Store report writes to `store_reports` table

**Given** a user submits a valid store report form
**When** the server action executes
**Then** a row is inserted into `store_reports` with appropriate data

**Requirements:**
- New table `store_reports` with columns:
  - `id` (uuid, PK)
  - `tenant_id` (uuid, FK → tenants, required) — the reported store
  - `reporter_email` (text, required) — not linked to auth; anonymous reporting
  - `reason` (text, required) — one of the enum categories
  - `details` (text, required, max 2000 chars)
  - `status` (enum: `pending`, `reviewed`, `actioned`, `dismissed`, default `pending`)
  - `moderator_notes` (text, nullable) — for internal review
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)
- RLS: anyone can INSERT (public reporting); only platform admins can SELECT/UPDATE
- Server action validates tenant exists before inserting
- Server action sanitizes input (strip HTML, trim, enforce max length)

**Acceptance Criteria:**
- [ ] Successful insert returns `{ success: true, data: { id: string } }`
- [ ] Non-existent tenant returns `{ success: false, error: "Tienda no encontrada" }`
- [ ] HTML in `details` is stripped before storage
- [ ] `details` > 2000 chars is rejected with validation error
- [ ] RLS policy allows anonymous INSERT on `store_reports`
- [ ] RLS policy blocks non-admin SELECT on `store_reports`

### Scenario 5.3: Platform admins can review store reports

**Given** a platform admin is logged into the dashboard
**When** they navigate to a moderation view
**Then** they can see and manage pending store reports

**Requirements:**
- New dashboard route: `/dashboard/admin/reports` (or extend existing `/dashboard/admin/review`)
- Server action `getPendingReports()` returns reports with `status = 'pending'`
- Admin can update `status` and add `moderator_notes` via server action `updateReportStatus()`
- UI: table or list view with report details, status dropdown, and notes field
- RLS: only platform admins can access these actions

**Acceptance Criteria:**
- [ ] Non-admin accessing `/dashboard/admin/reports` is redirected or shown 403
- [ ] Admin sees list of pending reports with email, reason, details preview, and date
- [ ] Admin can change status from `pending` to `reviewed`, `actioned`, or `dismissed`
- [ ] Status change persists and report disappears from "pending" view
- [ ] `moderator_notes` can be added/edited and persist

---

## 6. Database Schema Changes

### Scenario 6.1: Migration adds consent and reporting columns/tables

**Given** the database is at the current migration state
**When** the new migration runs
**Then** all required schema changes are applied atomically

**Requirements:**
Migration file: `supabase/migrations/20260616_legal_compliance.sql`

Changes:
1. **`site_settings`** — add column `legal_version text NOT NULL DEFAULT '1'`
2. **`tenant_members`** — add columns:
   - `legal_accepted_version text` (nullable, for existing rows)
   - `legal_accepted_at timestamptz` (nullable)
3. **`store_reports`** — new table (see Scenario 5.2)
4. **RLS policies** for `store_reports`:
   - `INSERT` for `anon` and `authenticated` (anyone can report)
   - `SELECT` and `UPDATE` for platform admins only (`public.is_platform_admin()`)

**Acceptance Criteria:**
- [ ] Migration runs without errors on a clean database
- [ ] Migration is idempotent (safe to re-run)
- [ ] Existing `tenant_members` rows are not deleted or modified (new columns nullable)
- [ ] `site_settings.legal_version` defaults to `'1'` for the seed row
- [ ] `store_reports` table has all specified columns with correct types and constraints
- [ ] RLS is enabled on `store_reports` with correct policies

---

## 7. Non-Functional Requirements

### Scenario 7.1: Legal pages are SEO-friendly

**Requirements:**
- `generateMetadata` in `src/app/legal/[slug]/page.tsx` sets appropriate `<title>` and `<meta description>` per slug
- T&C title: "Términos y Condiciones | IAPI Shop"
- Privacy title: "Política de Privacidad | IAPI Shop"

**Acceptance Criteria:**
- [ ] View source on `/legal/terminos` shows correct `<title>` tag
- [ ] View source on `/legal/privacidad` shows correct `<title>` tag

### Scenario 7.2: Performance budget

**Requirements:**
- Legal pages are fully static (no data fetching at request time)
- Time to First Byte (TTFB) < 200ms for legal pages on dev server
- Store report modal is lazy-loaded (dynamic import)

**Acceptance Criteria:**
- [ ] `src/app/legal/[slug]/page.tsx` has no `await` database calls
- [ ] `StoreReportDialog` is imported via `React.lazy()` or Next.js dynamic import

### Scenario 7.3: Rollback safety

**Requirements:**
- Single feature flag constant `LEGAL_LINKS_ENABLED` in `src/lib/legal/constants.ts` (default `true`)
- When `false`: footer links hidden, report button hidden, consent checkbox hidden
- Legal pages remain accessible at `/legal/*` even when flag is `false` (for users who bookmarked)

**Acceptance Criteria:**
- [ ] `LEGAL_LINKS_ENABLED = false` removes all UI touchpoints (footer links, report button, consent checkbox)
- [ ] `/legal/terminos` and `/legal/privacidad` still render when flag is `false`
- [ ] Re-enabling flag restores all UI without code changes
