# Design: Storefront & QR Generation

## Technical Approach

Most infrastructure already exists: QR utility (`src/lib/utils/qr.ts`), storefront data fetching (`src/lib/storefront/actions.ts`), dynamic `[slug]` route, dashboard QR page, and WhatsApp checkout via CartDrawer. Two gaps remain: per-product WhatsApp CTAs on product cards and interactive category filter chips. The design extends the existing pattern — server components fetch and pass data to client components — without restructuring the storefront page.

## Architecture Decisions

### Decision: Per-product WhatsApp as a utility function

**Choice**: Pure function `buildWhatsAppUrl(phone, productName)` in `src/lib/utils/whatsapp.ts` that returns `https://wa.me/{phone}?text=Hola, me interesa: {encodedName}`.

**Alternatives considered**: Inline URL construction in the ProductCard component.
**Rationale**: Follows the same pattern as `generateQRCodeDataURL()` — testable in isolation, avoids duplication across product cards.

### Decision: Category filtering as client component

**Choice**: Extract the product listing section into a `StorefrontCatalog` client component. The server page passes `categories` and `products` as props. Client state tracks `selectedCategory`; `useMemo` filters products.

**Alternatives considered**: URL query params with server re-fetch; CSS-only `:target` hack.
**Rationale**: No re-fetch needed — all products are already fetched in a single server call. Client-side filtering is instant, avoids layout shift, and keeps the SE-friendly server-rendered baseline intact via `generateMetadata`.

### Decision: Keep existing storefront architecture intact

**Choice**: Add WhatsApp buttons and filter chips to the existing `src/app/[slug]/page.tsx` without extracting a separate layout or restructuring the data flow.

**Alternatives considered**: Separate `src/app/(storefront)/[slug]/` route group.
**Rationale**: The change is additive (new buttons, new filter component). No route reorganization needed. Minimizes diff and preserves the working SEO metadata.

## Data Flow

```
User visits /[slug]
        │
        ▼
  generateMetadata() ← getStorefrontData(slug) → Supabase (tenants, categories, products)
        │
        ▼
  StorefrontPage (server) ──props──▶ StorefrontCatalog (client)
        │                                    │
        │                              useState(selectedCategory)
        │                              useMemo(filteredProducts)
        │                                    │
        ▼                                    ▼
  ProductCard ←── buildWhatsAppUrl()    Category chips + filtered grid
        │
        ▼
  WhatsApp button → wa.me link (new tab)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/utils/whatsapp.ts` | Create | `buildWhatsAppUrl(phone, productName)` — URL-encodes product name for wa.me link |
| `src/app/[slug]/page.tsx` | Modify | Add per-product WhatsApp button to ProductCard; delegate product listing to StorefrontCatalog client component |
| `src/components/storefront/storefront-catalog.tsx` | Create | Client component: receives categories + products as props, manages category filter state via `useState`, renders filter chips + filtered product grid |
| `src/components/storefront/add-to-cart-button.tsx` | Modify | Read-only — ensure WhatsApp button sits alongside (no structural change) |

## Interfaces / Contracts

```typescript
// New utility (src/lib/utils/whatsapp.ts)
function buildWhatsAppUrl(phone: string, productName: string): string

// StorefrontCatalog props
interface StorefrontCatalogProps {
  categories: { id: string; name: string }[];
  products: Product[];
  tenantId: string;
  brandColor: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
  category_id?: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `buildWhatsAppUrl` encoding | Vitest — verify URL encodes special chars, handles empty phone |
| Component | StorefrontCatalog filter | React Testing Library — simulate chip taps, verify filtered output |
| Component | ProductCard WhatsApp button | RTL — verify button hidden when phone missing, verify href structure |
| E2E | QR scan → storefront → WhatsApp | Playwright — verify full flow from QR URL to WhatsApp link |

Existing tests (`src/app/page.test.tsx`, `src/app/dashboard/performance.test.tsx`) remain unaffected.

## Migration / Rollout

No migration required. All changes are additive (new utility, new client component, new button in existing ProductCard). The QR page and storefront route already exist and work.

## Open Questions

- [ ] Should the WhatsApp button use `window.open` (current CartDrawer pattern) or a plain `<a>` tag with `target="_blank"`? Recommend `<a>` for simplicity and no JS dependency.
