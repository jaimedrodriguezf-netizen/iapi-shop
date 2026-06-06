# Design: Branding & Personalization

## Technical Approach

Additive DB migration (4 nullable columns, zero impact on active tenants) + CSS custom property pipeline: server reads `brand_color` → injects `--brand-color` on `<main>` → client components consume it via CSS variables. The settings form and storefront already exist; remaining work is migration, type alignment (`address` string → JSONB), hardcoded-color cleanup, tests, and cache revalidation.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Color injection** | `--brand-color` CSS custom property on `<main>` | No prop drilling. Client components read via `style={{ backgroundColor: 'var(--brand-color)' }}`. Rename existing `--brand-primary` to match spec. |
| **Address schema** | JSONB `{ street, city, state, zip, country }` | Spec requires structured address. Current flat string is split into 5 form fields. No query impact (display-only). |
| **Social links** | Static 3-field form → JSONB `{ instagram, facebook, tiktok }` | Existing form already implements this. Dynamic add/remove deferred to follow-up. |
| **Client color access** | CSS variables, not props | `AddToCartButton` and `CartDrawer` switch from `bg-violet-500` to `var(--brand-color)`. No prop drilling needed. |
| **Revalidation** | `revalidatePath('/[slug]')` in `updateTenantBranding` | Next.js `react.cache()` holds stale data. Revalidate on save ensures next visitor sees new color. |
| **Contrast check** | Curated palette pre-tested + CSS `color-contrast()` warning on freeform | 6 curated colors pass WCAG AA. Freeform hex shows warning if contrast < 4.5:1. |

## Data Flow

```
Dashboard save ──▶ updateTenantBranding() ──▶ DB UPDATE + revalidatePath('[slug]')
                                                       │
Visitor loads /[slug] ──▶ getStorefrontData() ◀────────┘ (cache purged)
        │
        ▼
  <main style={{ '--brand-color': brandColor }}>
        │
        ▼
  CSS cascade ▸ header bar ▸ category borders ▸ price text
              ▸ AddToCart bg ▸ CartDrawer trigger
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/{ts}_branding_fields.sql` | Create | Add `brand_color text`, `secondary_color text`, `address jsonb`, `social_links jsonb` (all nullable) |
| `supabase/migrations/{ts}_branding_fields.test.ts` | Create | Verify columns exist, NULL defaults, existing tenants unaffected |
| `src/lib/tenants/actions.ts` | Modify | `address` type: `string` → `Address` object. Add color regex validation. Add `revalidatePath`. |
| `src/lib/tenants/actions.test.ts` | Modify | Tests for `updateTenantBranding`: valid input, invalid hex, RLS rejection |
| `src/lib/storefront/actions.ts` | Modify | Update `StorefrontData.tenant.address` type to structured object |
| `src/components/dashboard/settings-form.tsx` | Modify | 1 address field → 5 structured fields. Zod schema update. Contrast warning. |
| `src/components/storefront/add-to-cart-button.tsx` | Modify | `bg-violet-500` → `style={{ backgroundColor: 'var(--brand-color)' }}` |
| `src/components/storefront/cart-drawer.tsx` | Modify | Hardcoded violet classes → `var(--brand-color)`. Checkout stays green. |
| `src/app/[slug]/page.tsx` | Modify | `--brand-primary` → `--brand-color`. Structured address rendering. |

## Interfaces

```typescript
interface Address {
  street?: string; city?: string; state?: string;
  zip?: string; country?: string;
}
interface SocialLinks {
  instagram?: string; facebook?: string; tiktok?: string;
}
// Tenant.address: string → Address | null
// Tenant.social_links: SocialLinks | null
```

## Testing Strategy

| Layer | What | Tool |
|-------|------|------|
| Migration | Columns exist, nullable, defaults NULL | `information_schema.columns` query |
| Unit | `updateTenantBranding` valid/invalid + RLS | Vitest (mocked Supabase) |
| Component | SettingsForm structured address, AddToCart var color | Vitest + RTL |
| E2E | Color round-trip: save → reload → verify `--brand-color` | Playwright |

## Migration / Rollout

Additive and nullable — no data migration required. The current `tenants` table has no `address` text column (only `city` and `province`), so no data loss. Rollback: `ALTER TABLE tenants DROP COLUMN brand_color, secondary_color, address, social_links;`.

## Open Questions

- [ ] `secondary_color` column exists in spec but has no UI scenarios. Add form field now or defer?
- [ ] Dynamic social link add/remove (spec calls for it, form has 3 static fields). Defer to follow-up?
