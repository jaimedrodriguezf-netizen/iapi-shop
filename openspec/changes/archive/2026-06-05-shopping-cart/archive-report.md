# Archive Report: Shopping Cart & WhatsApp Pro

**Change**: `shopping-cart`
**Archived**: 2026-06-05
**Mode**: openspec
**Verdict**: PASS (with 2 non-blocking WARNINGs)

## Summary

Client-side shopping cart for IAPI Shop storefront with `zustand` state management, tenant-scoped `localStorage` persistence, cart drawer UI, and WhatsApp order message formatting. All 10 implementation tasks complete. 146/146 tests pass, 0 type errors, build succeeds.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| cart | Created | New domain. 6 requirements with 16 scenarios. |

`openspec/specs/cart/spec.md` is the new source of truth.

## Archive Contents

```
openspec/changes/archive/2026-06-05-shopping-cart/
├── proposal.md         ✅
├── specs/cart/spec.md  ✅
├── design.md           ✅
├── tasks.md            ✅ (10/10 complete)
├── apply-progress.md   ✅
├── verify-report.md    ✅
└── archive-report.md   ✅
```

## Verification Outcome

| Dimension | Status |
|-----------|--------|
| Task completion | ✅ 10/10 |
| Spec compliance | ✅ PASS (6/6 requirements) |
| Design coherence | ✅ PASS (5/5 decisions aligned) |
| Build | ✅ PASS |
| Type check | ✅ PASS (0 errors) |
| Unit tests | ✅ PASS (146/146, 22 files) |

## Warnings (non-blocking)

1. **No explicit localStorage persistence test** — Zustand `persist` middleware correctly configured, but no test validates hydration from `localStorage` after reload. Low risk.
2. **No quantity selector on AddToCartButton** — Only "+1" per click. Spec uses "MAY" (optional). Drawer has +/- controls for adjustment.

## Resolution of Previous CRITICAL

The initial verify (FAIL) found a missing "Clear Cart" button in the `CartDrawer` UI. Resolved by adding a "Vaciar carrito" button in the drawer footer (`cart-drawer.tsx` L180-188) with `variant="ghost"`, `text-destructive`, and `Trash2` icon. The underlying `clearCart` function is tested in `cart-store.test.ts`.

## Files Changed (implementation)

| File | Action |
|------|--------|
| `src/lib/utils/whatsapp.ts` | Modified — added `formatCartMessage()`, `buildWhatsAppCartUrl()` |
| `src/lib/utils/whatsapp.test.ts` | Modified — added 9 test cases |
| `src/components/storefront/cart-drawer.tsx` | Modified — refactored `handleCheckout`, added "Vaciar carrito" |
| `src/lib/storefront/cart-store.test.ts` | Modified — expanded to 12 test cases |

Existing files (already present before this change): `src/lib/storefront/cart-store.ts`, `src/components/storefront/add-to-cart-button.tsx`, `src/components/storefront/cart-drawer.tsx`.

## SDD Cycle Complete

The `shopping-cart` change has been fully planned, implemented, verified, and archived. Main specs updated. Audit trail preserved. Ready for the next change.
