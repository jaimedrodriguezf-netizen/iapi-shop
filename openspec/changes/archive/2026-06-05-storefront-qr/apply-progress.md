# Apply Progress: storefront-qr

## Status: ✅ Complete

All 10 tasks implemented and verified.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/lib/utils/qr.ts` | Modified | Enhanced `generateQRCodeDataURL` with options interface; added `generateQR(slug, baseUrl?)` utility that constructs absolute URL and validates slug |
| `src/lib/utils/whatsapp.ts` | Created | `buildWhatsAppUrl(phone, productName)` — pure function that URL-encodes product name and strips phone formatting; throws on empty phone |
| `src/lib/utils/whatsapp.test.ts` | Created | Vitest unit tests: encoding, special chars, phone stripping, empty/undefined/whitespace phone guard |
| `src/lib/utils/qr.test.ts` | Created | Vitest unit tests: `generateQRCodeDataURL`, `generateQR` with slug, environment URL, slug validation |
| `src/components/storefront/storefront-catalog.tsx` | Created | Client component with `useState` category filter chips, `useMemo` product filtering, per-product WhatsApp CTA buttons, responsive grid |
| `src/components/storefront/storefront-catalog.test.tsx` | Created | RTL tests: filter by category, WhatsApp button visibility, empty state, single-category chip hiding |
| `src/app/[slug]/page.tsx` | Modified | Replaced inline ProductCard and category loop with `StorefrontCatalog` component; added `openGraph` metadata; kept server-rendered header/footer |
| `src/app/dashboard/qr/page.tsx` | Modified | Switched from `generateQRCodeDataURL` to `generateQR(slug, baseUrl)` for slug-based environment-aware QR generation |
| `src/app/dashboard/performance.test.tsx` | Modified | Added `generateQR` to `@/lib/utils/qr` mock to match new export |

## Architectural Decisions

1. **WhatsApp as `<a>` tag with `target="_blank"`** — follows the design doc recommendation (open question 1). No JS dependency; works on desktop and mobile.
2. **StorefrontCatalog client component** — receives categories + products as props from server page; `useState` for filter, `useMemo` for filtering. No re-fetch needed.
3. **`generateQR(slug, baseUrl?)`** — builds the absolute URL from slug + environment, then delegates to existing `generateQRCodeDataURL`. Used in dashboard QR page; storefront page continues to use `getStorefrontData`.

## Verification Results

- **TypeScript**: `tsc --noEmit` — 0 errors
- **Vitest**: 22 test files, 129 tests — all passing
- **GGA compliance**: No `any` types; server actions have `"use server"`; client components have `"use client"`; tenant isolation maintained via `tenant_id` filters in Supabase queries; `buildWhatsAppUrl` validates input and throws on empty phone