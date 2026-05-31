# Tasks: Order Management & Analytics

## Phase 1: Database & RLS
- [x] 1.1 Create migration for `orders` and `order_items` tables.
- [x] 1.2 Implement `order_status` enum.
- [x] 1.3 Add RLS policies for orders (Tenant-bound).

## Phase 2: Logic & Capture
- [x] 2.1 Create `createOrder` server action in `src/lib/orders/actions.ts`.
- [x] 2.2 Update `CartDrawer` to call `createOrder` upon checkout.
- [x] 2.3 Add unit tests for order creation and total verification.

## Phase 3: Dashboard & Analytics
- [x] 3.1 Create `/dashboard/orders` page with `DataTable`.
- [x] 3.2 Implement status update functionality (e.g., mark as delivered).
- [x] 3.3 Refactor `/dashboard/page.tsx` to query real sales data from Supabase.
- [x] 3.4 Implement sales chart based on real order history.

## Phase 4: Verification
- [x] 4.1 Verify multi-tenant isolation for orders.
- [x] 4.2 Run final GGA, TSC, and Lint checks.
