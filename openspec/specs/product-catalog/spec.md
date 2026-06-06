# Product Catalog Specification

## Purpose

Core product catalog domain: database schema, RLS tenant isolation, and CRUD for `categories`, `products`, `product_images`, and `tags`.

## Requirements

### Requirement: Tenant-bound tables and RLS policies

The system MUST store `categories` and `products` in tables with a `tenant_id` column. RLS policies SHALL restrict all reads/writes to rows matching the authenticated user's `tenant_id`. All application queries MUST include `.eq("tenant_id", tenant_id)`.

#### Scenario: Tenant-scoped access

- GIVEN a user authenticated for `tenant-A`
- WHEN they query `products` or `categories`
- THEN only rows with `tenant_id = 'tenant-A'` are returned
- AND RLS prevents cross-tenant data leakage.

#### Scenario: Cross-tenant isolation verified

- GIVEN User A has 3 products in tenant-123 and User B has 2 in tenant-456
- WHEN User A calls `getProducts("tenant-123")`
- THEN only 3 products are returned.

### Requirement: Category CRUD

The system SHALL provide server actions to create and list categories scoped to a tenant.

| Action | Description |
|--------|-------------|
| `createCategory(tenant_id, name)` | Creates category with auto-generated slug |
| `getCategories(tenant_id)` | Returns categories for the tenant, ordered by name |

#### Scenario: Create and list categories

- GIVEN an authenticated user
- WHEN `createCategory("tenant-123", "Bebidas")` is called
- THEN a category is inserted with auto-generated slug
- AND `getCategories("tenant-123")` returns it alphabetically.

### Requirement: Product CRUD

The system SHALL provide server actions for full product lifecycle management. Slugs MUST be auto-generated as lowercase, hyphen-separated strings with special characters removed.

| Action | Description |
|--------|-------------|
| `createProduct(input)` | Creates product with optional images (max 6), tags; auto-generates slug |
| `getProducts(tenant_id)` | Returns products with `categories.name` and sorted `image_urls` |
| `updateProduct(id, tenant_id, input)` | Updates fields; replaces images if provided; scoped to tenant |
| `deleteProduct(id, tenant_id)` | Deletes product and cascades associated images/tags |

#### Scenario: Create product with images

- GIVEN an authenticated user
- WHEN `createProduct` is called with name, price, image_urls, and tags
- THEN product, product_images (max 6), and product_tags rows are inserted.

#### Scenario: Read products with resolved data

- GIVEN tenant has products with categories and images
- WHEN `getProducts("tenant-123")` is called
- THEN products include `categories.name` and `image_urls` sorted by display order.

#### Scenario: Update and delete tenant-scoped

- GIVEN product "prod-1" belongs to "tenant-123"
- WHEN `updateProduct("prod-1", "tenant-123", { price: 20 })` is called
- THEN only "prod-1" is updated; the tenant filter prevents cross-tenant writes.
- WHEN `deleteProduct("prod-1", "tenant-123")` is called
- THEN the product is deleted and cascades remove associated rows.

### Requirement: Image upload with storage fallback

The system SHALL upload product images to Supabase Storage and fall back to base64 data URLs on failure.

#### Scenario: Upload success and fallback

- GIVEN a valid image file and tenant ID
- WHEN `uploadProductImage(formData)` succeeds
- THEN the file is stored in `products/{tenantId}/{filename}` and the public URL returned.
- WHEN Supabase Storage errors
- THEN a base64 data URL is returned with `{ fallback: true }`.

### Requirement: Plan limits enforcement

The system SHALL enforce product count limits per tenant based on subscription plan (e.g., Free plan: 10 products).

#### Scenario: Free plan limit enforced

- GIVEN a tenant on Free plan with 10 products
- WHEN they attempt to create an 11th product
- THEN creation is rejected with an appropriate error.
