# Tasks: Shopping Cart & WhatsApp Pro

## Phase 1: Logic & State (TDD)
- [ ] 1.1 Install `zustand` and `lucide-react`.
- [ ] 1.2 Implement `src/lib/storefront/cart-store.ts` with tenant-scoped persistence.
- [ ] 1.3 Add unit tests for total calculation and quantity logic.

## Phase 2: Core Storefront UI
- [ ] 2.1 Update `ProductCard` to include "Add to Cart" and quantity selectors.
- [ ] 2.2 Create `CartDrawer` component using shadcn `Drawer`.
- [ ] 2.3 Implement floating "Cart Button" with item counter badge.

## Phase 3: WhatsApp Integration
- [ ] 3.1 Implement WhatsApp message formatting utility (markdown style).
- [ ] 3.2 Connect "Send Order" button to the WhatsApp API bridge.

## Phase 4: Verification
- [ ] 4.1 Verify cart isolation between two different sucursales (using slugs).
- [ ] 4.2 Run final architectural (GGA) and type checks.
