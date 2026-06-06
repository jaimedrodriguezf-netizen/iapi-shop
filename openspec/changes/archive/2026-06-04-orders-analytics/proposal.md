# Proposal: Order Management & Analytics

## Intent
Transform the platform from a simple catalog into a data-driven business tool by persisting customer orders and providing merchants with sales analytics.

## Scope
### In Scope
- Database schema for `orders` and `order_items`.
- RLS policies to isolate orders per tenant.
- Automatic order creation triggered when a user clicks "Pedir por WhatsApp".
- Merchant view: `/dashboard/orders` to list and filter orders.
- Dashboard home update: Replace mock charts/counters with real data from the `orders` table.
- Order statuses: `pending`, `confirmed`, `delivered`, `cancelled`.

### Out of Scope
- Full payment status synchronization (will be linked to Phase 10 PayPal later).
- Customer account/order history (customers only see the current order).
- Inventory deduction on order (reserved for Phase 12).

## Approach
1.  **Schema**: Create `orders` and `order_items` tables. Ensure `tenant_id` is present for RLS.
2.  **Logic**: Implement a `createOrder` server action that handles the transaction of saving the order and its items.
3.  **UI Integration**: Update the `CartDrawer` to call `createOrder` before redirecting to WhatsApp.
4.  **Analytics**: Refactor the Dashboard home to query the `orders` table for total sales and active order counts.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orders created but message not sent | Medium | We save the order *before* redirection; if the user closes the tab before WhatsApp opens, we still have the record. |
| Inaccurate analytics | Low | Use SQL aggregations (`SUM`, `COUNT`) directly from Supabase for high accuracy. |

## Success Criteria
- [ ] Clicking "Pedir por WhatsApp" creates a record in the `orders` table.
- [ ] Merchant can see the order details in `/dashboard/orders`.
- [ ] Dashboard counters correctly show the number of orders and total revenue.
- [ ] Orders are strictly isolated by `tenant_id`.
