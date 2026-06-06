# Design: Shopping Cart & WhatsApp Pro

## Technical Approach

Client-side cart via `zustand` v5 with `persist` middleware targeting `localStorage`. Cart state is keyed by `tenant_id` into a `Record<string, CartItem[]>` map, guaranteeing zero cross-tenant leakage per GGA mandate. The `CartDrawer` is a single component that bundles the floating trigger (badge), item list, quantity controls, order persistence via `createOrder` server action, and WhatsApp bridge. All storefront components live under `src/lib/storefront/` (logic) and `src/components/storefront/` (UI).

## Architecture Decisions

### Decision: Zustand + persist over React Context + manual localStorage

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| Zustand + persist middleware | External dep (already installed); selector-based subscriptions avoid re-render cascades | **Chosen** |
| React Context + useReducer + manual Storage | Zero deps; verbose serialization/deserialization; no middleware ecosystem | Rejected |
| Jotai / Redux Toolkit | Overkill for a single store; adds bundle weight with no benefit | Rejected |

**Rationale**: `zustand` is already in `package.json` (v5.0.13), provides built-in `persist` with `createJSONStorage`, and its selector pattern (`useCart(s => s.addItem)`) prevents unnecessary re-renders when only one tenant's cart changes.

### Decision: Single `carts` map vs per-tenant store instances

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| `Record<tenantId, CartItem[]>` single store | One hydration on page load; easy cross-tenant audit | **Chosen** |
| Separate store per tenant (dynamic `create`) | Cleaner per-tenant API; complex lifecycle; hard to persist multiple stores atomically | Rejected |

**Rationale**: One `localStorage` key (`iapi-cart-storage-v4`) means one `JSON.parse` on hydration. The `getTenantItems(tenantId)` / `getTenantTotal(tenantId)` selectors naturally scope reads.

### Decision: Base UI Dialog (Drawer) over Radix / shadcn Sheet

| Option | Tradeoff | Verdict |
|--------|----------|---------|
| @base-ui/react Dialog (custom Drawer wrapper) | Already the project's modal primitive; bottom-sheet animation via `data-side` CSS | **Chosen** |
| vaul (already installed) | Purpose-built for bottom sheets; would add a second drawer abstraction | Rejected |
| Radix Dialog | Not the project pattern — Base UI is the standard | Rejected |

**Rationale**: The project already has `src/components/ui/drawer.tsx` wrapping `@base-ui/react/dialog` with `data-side` transitions. No new dependency needed.

## Data Flow

```
ProductCard ──(addItem)──▶ zustand CartStore ──(persist)──▶ localStorage
     │                         │
     │                    CartDrawer (reads via selector)
     │                         │
     │              ┌──────────┼──────────┐
     │              │          │          │
     │         badge counter  item list  "Pedir por WhatsApp"
     │                             │
     │                    createOrder (server action)
     │                             │
     │                      Supabase orders + order_items
     │                             │
     └─────────────────────────────┴──▶ wa.me/?text={encoded}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/storefront/cart-store.ts` | **Create** | Zustand store: `CartItem` interface, `CartState` with tenant-scoped CRUD + getters + `localStorage` persist |
| `src/lib/storefront/cart-store.test.ts` | **Create** | Vitest unit tests: add, increment, tenant isolation, clear |
| `src/components/storefront/add-to-cart-button.tsx` | **Create** | Client component; `Plus` icon button calling `addItem()`; sonner toast feedback |
| `src/components/storefront/cart-drawer.tsx` | **Create** | Full Drawer with floating trigger/badge, item list, +/- qty controls, delete, WhatsApp checkout, `createOrder` call |
| `src/components/storefront/cart-drawer.test.tsx` | **Create** | Vitest + RTL test: aria-labels, tabular-nums classes, empty/active states |
| `src/app/[slug]/page.tsx` | **Modify** | Import and render `AddToCartButton` inside `ProductCard`; render `CartDrawer` with tenant props |
| `src/lib/storefront/actions.ts` | (existing) | Server action for storefront data fetch — untouched |
| `src/lib/orders/actions.ts` | (existing) | Server action for order persistence — consumed by CartDrawer |

## Interfaces / Contracts

```typescript
// cart-store.ts — core contract
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  tenant_id: string
}

interface CartState {
  carts: Record<string, CartItem[]>
  addItem: (tenantId: string, product: Omit<CartItem, 'quantity' | 'tenant_id'>) => void
  removeItem: (tenantId: string, productId: string) => void
  updateQuantity: (tenantId: string, productId: string, quantity: number) => void
  clearCart: (tenantId: string) => void
  getTenantItems: (tenantId: string) => CartItem[]
  getTenantTotal: (tenantId: string) => number
}
```

`CartDrawer` props: `{ whatsapp?: string, tenantName: string, tenantId: string }`.
`AddToCartButton` props: `{ product: { id, name, price, image_url?, tenant_id } }`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Cart arithmetic (add, increment, remove, total, clear, isolation) | Vitest — `cart-store.test.ts`; reset state in `beforeEach` |
| Component | Drawer DOM: aria-labels, tabular-nums, badge visibility, empty state | Vitest + RTL + jsdom — `cart-drawer.test.tsx`; mock `createOrder` |
| E2E | Full flow: browse product → add to cart → open drawer → send WhatsApp | Playwright (future task 4.x) |
| Type | Full project typecheck | `npm run typecheck` per verify phase |

## Migration / Rollout

No migration required. Feature is additive — `CartDrawer` renders only on `/[slug]` storefront pages, never on landing `/`. If rollback needed, remove the `<CartDrawer>` render and `AddToCartButton` from `ProductCard`.

## Open Questions

- [ ] Should the WhatsApp message formatter be extracted into a standalone `src/lib/storefront/whatsapp.ts` utility (per task 3.1), or is the inline formatting in `CartDrawer.tsx` sufficient?
- [ ] The spec mentions a quantity selector on `ProductCard` — currently only "+1" button exists. Should this be implemented, or deferred since the Drawer already has +/- controls?
