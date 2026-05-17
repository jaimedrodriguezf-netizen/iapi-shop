# Tasks: Storefront & QR Generation

## Phase 1: QR Infrastructure
- [ ] 1.1 Implement QR generation utility in `src/lib/utils/qr.ts`.
- [ ] 1.2 Create `/dashboard/qr` page to display the sucursal's QR code.
- [ ] 1.3 Add "Download QR" functionality.

## Phase 2: Public Storefront
- [ ] 2.1 Create dynamic route `src/app/[slug]/page.tsx`.
- [ ] 2.2 Implement server-side data fetching for tenant and its products.
- [ ] 2.3 Build mobile-first storefront UI (Header, Categories, Product Cards).

## Phase 3: Interaction & SEO
- [ ] 3.1 Implement WhatsApp message generator (pre-filled text with product name).
- [ ] 3.2 Add dynamic metadata (SEO) based on the sucursal name.

## Phase 4: Verification
- [ ] 4.1 Verify QR link accuracy using Tailscale IP.
- [ ] 4.2 Run final architectural (GGA) and type checks.
