# Proposal: Ecuadorean Legal Compliance Docs

## Intent

Make IAPI Shop compliant with Ecuadorean legislation (LCE, LODC, LOPDP) by publishing transparent Terms & Conditions and Privacy Policy, capturing explicit user consent, and implementing a store-reporting channel for safe-harbor protection.

## Scope

### In Scope
- Legal pages: T&C (`/legal/terminos`) and Privacy Policy (`/legal/privacidad`)
- Global footer links to legal pages on landing and storefront pages
- Explicit consent checkbox on `/register` and `/onboarding`
- Re-consent mechanism: banner/notification when legal docs are updated
- Store reporting mechanism (`Denunciar tienda`) on storefronts for LCE safe harbor

### Out of Scope
- Formal legal review by an Ecuadorian attorney
- WhatsApp Business terms compliance
- International jurisdiction adaptations

## Capabilities

### New Capabilities
- `legal-pages`: Static legal content rendering under `/legal/[slug]`
- `legal-consent`: Consent capture, storage, and re-consent enforcement
- `store-reporting`: Public store-reporting form and moderation inbox

### Modified Capabilities
- `onboarding`: Add T&C + Privacy Policy consent checkbox before tenant creation
- `storefront`: Add legal footer links and a "Denunciar tienda" reporting action
- `settings`: Surface re-consent banner when the merchant has not accepted the latest legal version

## Approach

Use **Option B (Grouped Legal Layout)** per exploration: a dynamic route `src/app/legal/[slug]/page.tsx` that renders static Spanish content modules for `terminos` and `privacidad`. Content follows superpaco.com reference style. Store reporting is a lightweight server action writing to a new `store_reports` table. Consent state is tracked on `tenant_members` or a dedicated `legal_consents` table with `version` and `accepted_at` columns. Re-consent is triggered by a `legal_version` config bump in `site_settings`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/legal/[slug]/page.tsx` | New | Grouped legal page renderer |
| `src/app/legal/content/*.tsx` | New | T&C and Privacy Policy content blocks |
| `src/components/landing/marketplace-page.tsx` | Modified | Add `/legal` footer links |
| `src/app/[slug]/page.tsx` | Modified | Add footer links + report button |
| `src/app/register/page.tsx` | Modified | Add consent checkbox |
| `src/app/onboarding/page.tsx` | Modified | Add consent checkbox |
| `src/app/dashboard/settings/` | Modified | Re-consent banner for pending merchants |
| `src/lib/legal/actions.ts` | New | Consent and reporting server actions |
| Supabase schema | New | `store_reports` and consent-version columns |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Legal text accuracy gaps | Med | Draft closely against superpaco.com; flag need for attorney review |
| Re-consent friction blocks onboarding | Med | Non-intrusive banner; allow dashboard access but nag persistently |
| False/abusive store reports | Med | Require reporter email + reason; manual review before action |

## Rollback Plan

1. Hide `/legal` links from footers and nav via a single feature-flag constant.
2. Revert database migration that adds reporting/consent tables.
3. Remove the `legal/[slug]` route and related server actions.

## Dependencies

- None external.

## Success Criteria

- [ ] `/legal/terminos` and `/legal/privacidad` render correctly on mobile and desktop
- [ ] `/register` and `/onboarding` block submission until consent checkbox is checked
- [ ] Consent acceptance with version and timestamp is persisted in the database
- [ ] Updating the legal doc version triggers a re-consent banner for existing merchants
- [ ] Storefronts display a working "Denunciar tienda" form that writes to `store_reports`
