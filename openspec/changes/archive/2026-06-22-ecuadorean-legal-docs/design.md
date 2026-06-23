# Design: Ecuadorean Legal Compliance Docs

## Technical Approach

Static legal pages under `/legal/[slug]` with server-rendered Spanish content modules. Consent tracked via columns on `tenant_members` (no new table). Store reporting via a new `store_reports` table with public INSERT RLS. Single feature flag `LEGAL_LINKS_ENABLED` gates all UI touchpoints for instant rollback. All mutations follow existing patterns: `"use server"` actions in `src/lib/legal/actions.ts`, Zod validation, structured `{ success, error }` returns, rate limiting where public-facing.

## Architecture Decisions

### Decision: Static content modules over DB-backed CMS

| Option | Tradeoff | Decision |
|--------|----------|----------|
| DB-backed content in `site_settings` | Dynamic edits, extra reads, overkill | ❌ Rejected |
| Static TSX modules in `src/app/legal/content/` | Zero DB reads, fast TTFB, requires deploy for edits | ✅ Chosen |

**Rationale**: Legal docs change rarely (version bumps). Spec 7.2 mandates no `await` on legal pages. Static modules satisfy this trivially.

### Decision: Consent columns on `tenant_members` over separate table

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `legal_consents` table | Audit trail per version, but extra joins | ❌ Rejected |
| `legal_accepted_version` + `legal_accepted_at` on `tenant_members` | Simple, one-row lookup, no history | ✅ Chosen |

**Rationale**: Spec requires version + timestamp, not full history. Existing `tenant_members` already scoped per user-tenant pair. Adding two nullable columns is migration-safe.

### Decision: `store_reports` with anonymous INSERT RLS

**Choice**: Public INSERT policy (no auth required), SELECT/UPDATE restricted to `is_platform_admin()`.
**Alternatives**: Authenticated-only reporting (rejects — reduces safe-harbor coverage).
**Rationale**: LCE safe harbor requires accessible notice channel. Rate limiting at action level mitigates spam.

### Decision: Feature flag as module constant

**Choice**: `LEGAL_LINKS_ENABLED` in `src/lib/legal/constants.ts` (default `true`).
**Alternatives**: Env variable, DB flag, remote config.
**Rationale**: Single constant = instant rollback via one-line change + redeploy. No runtime overhead. Spec 7.3 requires this exact pattern.

## Data Flow

```
┌─ Legal Pages (read-only, static) ─────────────────────────┐
│  /legal/[slug] → content/{terminos,privacidad}.tsx         │
│  No DB calls. generateMetadata for SEO.                    │
└────────────────────────────────────────────────────────────┘

┌─ Consent Flow ────────────────────────────────────────────┐
│  /register, /onboarding                                    │
│    → checkbox sets accepted_legal_terms in FormData        │
│    → register/createTenant action validates + writes       │
│      tenant_members.legal_accepted_version/at              │
│                                                            │
│  /dashboard/*                                              │
│    → layout reads site_settings.legal_version              │
│    → compares with user's legal_accepted_version           │
│    → mismatch → ReConsentBanner → acceptLegalTerms()       │
└────────────────────────────────────────────────────────────┘

┌─ Store Reporting ─────────────────────────────────────────┐
│  /[slug] footer → "Denunciar tienda" button                │
│    → StoreReportDialog (lazy-loaded)                       │
│    → submitStoreReport() action                            │
│    → INSERT into store_reports (anon RLS)                  │
│                                                            │
│  /dashboard/admin/reports                                  │
│    → getPendingReports() → admin table                     │
│    → updateReportStatus() → status + moderator_notes       │
└────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260616_legal_compliance.sql` | Create | Migration: `site_settings.legal_version`, `tenant_members` consent columns, `store_reports` table + RLS |
| `src/lib/legal/constants.ts` | Create | `LEGAL_LINKS_ENABLED` flag, report reason enum |
| `src/lib/legal/actions.ts` | Create | `acceptLegalTerms()`, `submitStoreReport()`, `getPendingReports()`, `updateReportStatus()` |
| `src/lib/legal/actions.test.ts` | Create | Unit tests for all legal actions |
| `src/app/legal/layout.tsx` | Create | Shared legal layout: centered prose container |
| `src/app/legal/[slug]/page.tsx` | Create | Dynamic route: resolves content module or `notFound()` |
| `src/app/legal/content/terminos.tsx` | Create | T&C content component (8 sections per LCE/LODC/LOPDP) |
| `src/app/legal/content/privacidad.tsx` | Create | Privacy Policy content component (7 sections per LOPDP) |
| `src/components/legal/re-consent-banner.tsx` | Create | Dashboard banner for version mismatch |
| `src/components/legal/store-report-dialog.tsx` | Create | Lazy-loaded modal with report form |
| `src/components/legal/legal-footer-links.tsx` | Create | Reusable footer links component |
| `src/components/legal/consent-checkbox.tsx` | Create | Reusable consent checkbox with links |
| `src/app/dashboard/admin/reports/page.tsx` | Create | Admin moderation page for store reports |
| `src/app/dashboard/layout.tsx` | Modify | Add `ReConsentBanner` above `{children}` |
| `src/components/auth/auth-form.tsx` | Modify | Add `ConsentCheckbox` in register mode |
| `src/app/onboarding/page.tsx` | Modify | Add `accepted_legal_terms` to Zod schema + checkbox |
| `src/lib/auth/actions.ts` | Modify | `register` action: validate + persist consent |
| `src/lib/tenants/actions.ts` | Modify | `createTenant` input type: add `accepted_legal_terms` |
| `src/components/landing/marketplace-client.tsx` | Modify | Add `LegalFooterLinks` in footer |
| `src/app/[slug]/page.tsx` | Modify | Add `LegalFooterLinks` + "Denunciar tienda" button in footer |

## Interfaces / Contracts

```typescript
// src/lib/legal/constants.ts
export const LEGAL_LINKS_ENABLED = true;
export const CURRENT_LEGAL_VERSION = "1";

export const REPORT_REASONS = [
  "Productos ilegales",
  "Estafa/fraude",
  "Contenido inapropiado",
  "Suplantación de identidad",
  "Otro",
] as const;

// src/lib/legal/actions.ts
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function acceptLegalTerms(): Promise<ActionResult<{ version: string }>>;
export async function submitStoreReport(input: {
  tenant_id: string;
  reporter_email: string;
  reason: typeof REPORT_REASONS[number];
  details: string;
}): Promise<ActionResult<{ id: string }>>;
export async function getPendingReports(): Promise<ActionResult<StoreReport[]>>;
export async function updateReportStatus(reportId: string, status: ReportStatus, notes?: string): Promise<ActionResult<void>>;

// DB: store_reports
interface StoreReport {
  id: string;
  tenant_id: string;
  reporter_email: string;
  reason: string;
  details: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `acceptLegalTerms`, `submitStoreReport`, `getPendingReports`, `updateReportStatus` | Vitest + mocked Supabase client. Test auth guards, validation, RLS-level errors, HTML stripping, max-length enforcement |
| Unit | `register` action consent path | Extend existing `auth/actions.test.ts` — verify rejection without consent, persistence with consent |
| Component | `ConsentCheckbox`, `ReConsentBanner`, `StoreReportDialog`, `LegalFooterLinks` | Vitest + RTL — checkbox state, banner visibility, form validation, flag gating |
| Component | `AuthForm` register mode | Extend existing `auth-form.test.tsx` — consent checkbox present, submit disabled |
| E2E | Full report flow | Playwright — navigate storefront → click "Denunciar" → fill form → submit → verify toast → verify DB row |
| E2E | Consent on registration | Playwright — `/register` → verify checkbox blocks submit → accept → verify redirect |
| Migration | RLS policies | SQL test file alongside migration — verify anon INSERT, anon SELECT blocked, admin SELECT allowed |

## Migration / Rollout

1. **Migration** `20260616_legal_compliance.sql` adds columns (nullable, backward-compatible) and new table.
2. **Deploy code** with `LEGAL_LINKS_ENABLED = true` — all features activate.
3. **Rollback**: set `LEGAL_LINKS_ENABLED = false` → footer links, report button, consent checkbox disappear. Legal pages remain accessible. DB migration stays (no data loss).
4. **Version bump**: admin updates `site_settings.legal_version` to `"2"` → existing merchants see re-consent banner on next dashboard visit.

## Open Questions

- [ ] Should `submitStoreReport` have its own rate limiter (separate from `authRateLimit`)?
- [ ] Should the admin reports page live under `/dashboard/admin/reports` or extend existing `/dashboard/admin/review`?
