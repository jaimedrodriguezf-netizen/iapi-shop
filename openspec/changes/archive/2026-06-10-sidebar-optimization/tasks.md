# Tasks: Sidebar Optimization

## Phase 1: Implement AppSidebar and Layout changes
- [x] Modify `src/components/dashboard/app-sidebar.tsx` to add "Pedidos" navigation item with the `ShoppingBag` icon, pointing to `/dashboard/orders` (accessible to all plans).
- [x] Correct the URL of "Mis Sucursales" to `/dashboard` in `app-sidebar.tsx`, checking `item.title === "Mis Sucursales"` to control its visibility (Business plan / admin only).
- [x] Accept new props `activeTenantName` and `activeTenantColor` in `AppSidebar` and show a visual indicator under the logo.
- [x] Modify `src/app/dashboard/layout.tsx` to fetch the active tenant (`tenants[0]`) and pass `activeTenantName` and `activeTenantColor` to `AppSidebar`.

## Phase 2: Quality & Verification
- [x] Run typescript compiler check: `npx tsc --noEmit`.
- [x] Run tests: `npm test`.
