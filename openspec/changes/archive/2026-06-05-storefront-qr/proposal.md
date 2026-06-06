# Proposal: Storefront & QR Generation

## Intent
Create the public-facing side of the platform where end-customers can view a sucursal's catalog and initiate contact via WhatsApp.

## Scope
### In Scope
- Dynamic route `src/app/[slug]/page.tsx` to display the public catalog.
- Mobile-first catalog UI with category filtering.
- QR code generation logic and display in the merchant dashboard.
- "Order via WhatsApp" integration.

### Out of Scope
- Full checkout flow or cart management (Phase 8).
- Advanced product search or filtering by attributes.

## Approach
1.  **Public Route**: Implement a dynamic segment `[slug]` that fetches tenant and product data based on the URL.
2.  **QR Engine**: Use the `qrcode` library to generate SVG or Base64 QR codes for each sucursal's public link.
3.  **Customer UI**: Design a lightweight, high-performance catalog view optimized for mobile browsers (where most QR scans happen).
4.  **Dashboard Integration**: Add a new "Códigos QR" page in the dashboard to let merchants download their QR.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Slug collision with internal routes | Medium | Use a prefix for internal routes or careful route ordering (Next.js handles this by prioritizing static routes). |
| QR Link mismatch | Low | Use absolute URLs based on the current environment. |

## Success Criteria
- [ ] Scanning a QR code takes the user to the correct `/[slug]` page.
- [ ] The public page displays products belonging ONLY to that sucursal.
- [ ] Clicking a product opens a direct WhatsApp chat with the merchant.
