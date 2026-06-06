# Proposal: Shopping Cart & WhatsApp Pro

## Intent
Enable end-customers to build a multi-item order in the storefront and send a structured summary to the merchant via WhatsApp, improving the conversion from browsing to purchasing.

## Scope
### In Scope
- Client-side shopping cart state (Add, Remove, Clear, Update quantity).
- Cart Drawer/Overlay UI for easy access on mobile.
- Automatic total calculation including potential taxes or fees (initially simple sum).
- WhatsApp Message Generator: Creates a professional, itemized list of the order with a "Send Order" CTA.
- Persistence of cart data in `localStorage` scoped by `tenant_id` (so users can have different carts for different sucursales).

### Out of Scope
- Server-side order storage (Phase 11).
- Coupons or complex discounts.
- Delivery fee calculation based on maps.

## Approach
1.  **State Management**: Use `zustand` for a lightweight, performant cart store.
2.  **Cart Scoping**: Ensure the cart logic respects the current `tenant_id` to prevent items from "Sucursal A" appearing in "Sucursal B".
3.  **UI/UX**: Add "Add to Cart" buttons to `ProductCard`. Implement a floating "View Cart" button that opens a shadcn `Drawer`.
4.  **WhatsApp Bridge**: Create a utility to format the cart items into a readable string for the `wa.me` URL.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cart mix-up between tenants | Medium | Explicitly scope localStorage keys with the tenant slug or ID. |
| Message length limits | Low | WhatsApp URLs handle large strings well, but we should truncate very long descriptions. |

## Success Criteria
- [ ] User can add 3 different products and see the total update correctly.
- [ ] Clicking "Finalizar Pedido" opens WhatsApp with the full list and total price.
- [ ] Cart state survives a page refresh.
- [ ] Cart is empty if the user visits a different sucursal.
