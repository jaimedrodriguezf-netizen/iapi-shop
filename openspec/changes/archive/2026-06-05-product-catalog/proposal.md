# Proposal: Product Catalog

## Intent
Allow merchants to manage their products and categories within their "Sucursales". This is the core functionality for the storefront.

## Scope
### In Scope
- Database schema for `categories` and `products`.
- RLS policies to isolate products per tenant.
- Product CRUD (Create, Read, Update, Delete).
- Integration with OpenAI to suggest product descriptions based on names.
- Basic image upload support (storing URLs).

### Out of Scope
- Advanced inventory management (serial numbers, multiple warehouses).
- Complex variations (size/color matrix) - starting with simple products.
- Public storefront display (this is only for the merchant dashboard).

## Approach
1.  **Schema**: Create a migration for `categories` and `products` tables, ensuring they have `tenant_id` for RLS.
2.  **Server Actions**: Implement actions for managing products.
3.  **UI**: Create `/dashboard/products` with a searchable data table and a creation form.
4.  **AI Integration**: Add a "Generate with IA" button in the description field.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data leakage between tenants | High | Strict RLS policies and mandatory `tenant_id` on all queries. |
| AI API Costs | Medium | Limit generations per user/tenant based on their plan. |

## Success Criteria
- [ ] Merchant can create a category.
- [ ] Merchant can create a product and link it to a category.
- [ ] Product list is filtered by the active tenant.
- [ ] AI generates a relevant description for a product name.
