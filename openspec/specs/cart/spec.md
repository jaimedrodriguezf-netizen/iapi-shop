# Cart Specification

## Purpose
Client-side shopping cart for IAPI Shop storefront: multi-item order building, tenant-scoped `localStorage` persistence, and WhatsApp order summaries via `wa.me`.

## Requirements

### Requirement: Tenant-Scoped Cart State
The system MUST use `zustand` with `Record<tenantId, CartItem[]>` structure. Items SHALL have `id`, `name`, `price`, `quantity`, `image_url`. Operations per tenant: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTenantItems`, `getTenantTotal`. Cart MUST survive page refresh.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Add to empty cart | Empty cart for tenant A | `addItem(A, product)` | Cart A has 1 item qty 1; total = price |
| Add existing increments | Cart A has item "1" qty 1 | `addItem(A, same product)` | Item qty = 2; total doubles |
| Remove item | Cart A has items "1" and "2" | `removeItem(A, "2")` | Item "2" removed; total recalculates |
| Update to zero removes | Cart A has item "1" qty 2 | `updateQuantity(A, "1", 0)` | Item removed |
| Clear single tenant | Carts A and B have items | `clearCart(A)` | Cart A empty; Cart B unchanged |
| Cross-tenant isolation | A total = 10; B total = 50 | Get totals | Returns 10 for A, 50 for B |
| Persist across refresh | Cart has items | Reload page | Items restored from `localStorage` |

### Requirement: ProductCard Add-to-Cart
`ProductCard` SHALL render an "Add to Cart" button defaulting to qty 1. It MAY show a quantity selector.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Add product | Browsing ProductCard | Click "Add to Cart" | Item added to current tenant cart qty 1 |
| With quantity selector | Selector set to 3 | Click "Add to Cart" | Item added with qty 3 |

### Requirement: Cart Drawer
The system SHALL provide a `CartDrawer` using `shadcn/ui Drawer`. It MUST list items with quantity, line subtotal, grand total, and "Clear Cart" / "Send Order" actions.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Open with items | Cart has items | Open Drawer | Itemized list with line prices and grand total |
| Open empty cart | Cart is empty | Open Drawer | Shows empty state message |
| Clear from drawer | Cart has items | Click "Clear Cart" | Cart empties; drawer updates |

### Requirement: Floating Cart Button
A floating button SHALL appear on storefront pages with an item-count badge. It SHALL open the Cart Drawer. It MUST NOT render on landing `/` or non-storefront pages.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Badge shows count | 3 items in cart, storefront | View page | Button visible; badge "3" |
| Empty cart, no badge | Empty cart, storefront | View page | Button visible; no badge |
| Absent on landing | On `/` | View page | Button not rendered |

### Requirement: WhatsApp Order Formatting
The system MUST format cart into a WhatsApp message with tenant name, itemized list (name × qty = subtotal), and grand total. Descriptions over 120 chars SHOULD be truncated.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Format multi-item order | 2 items, total 35 | Generate message | Itemized list with line prices; total 35 |
| Truncate long name | Item name 200 chars | Generate message | Name truncated to 120 chars |

### Requirement: Send Order via WhatsApp
The "Send Order" action MUST open `wa.me` with the formatted message and tenant phone. It MUST be disabled when cart is empty.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Send populated cart | Items in cart; tenant phone set | Click "Send Order" | WhatsApp opens with formatted order |
| Disabled when empty | Empty cart | View button | Button is disabled |
