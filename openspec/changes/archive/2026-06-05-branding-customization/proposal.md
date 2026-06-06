# Proposal: Branding & Personalization

## Intent
Enable merchants to customize the visual appearance of their public storefronts, creating a unique brand experience for their customers.

## Scope
### In Scope
- Database schema update for `tenants`: `brand_color`, `secondary_color`, `address`, `social_links` (JSONB).
- Logo upload logic (currently via URL, integrating actual upload in Phase 7).
- Dashboard settings page `/dashboard/settings` with a branding preview.
- Dynamic theme injection in the public storefront `/[slug]` (Primary color will affect buttons, icons, and highlights).
- "Información de Contacto" section in the storefront footer.

### Out of Scope
- Custom fonts (starting with Geist as the project standard).
- Full CSS overrides or custom themes.

## Approach
1.  **Schema Evolution**: Add branding fields to the `tenants` table using a Supabase migration.
2.  **Logic**: Create Server Actions to update sucursal settings.
3.  **Settings UI**: Build a responsive settings form in the dashboard using shadcn/ui.
4.  **Storefront adaptation**: Modify the public page to use inline CSS variables or dynamic Tailwind classes based on the `tenant.brand_color`.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Accessibility issues with light colors | High | Implement a "Contrast Check" or suggest darker versions of the selected color for text/buttons. |
| Inconsistent look & feel | Medium | Constrain color choices or provide a set of professionally curated palettes. |

## Success Criteria
- [ ] Merchant can change the primary color in the dashboard.
- [ ] The public storefront immediately reflects the new color on buttons and headers.
- [ ] Merchant can add their business address and social media links.
- [ ] The storefront displays the correct logo or a fallback initial.
