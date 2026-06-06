# Tenants Specification

## Purpose

Server-side logic for creating and managing merchant tenants (shops), including transactional multi-table insertion and slug validation.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Authenticated user creates a tenant | MUST | Only authenticated users can create a tenant with name, slug, and optional WhatsApp phone |
| R2 | Slug format validation | MUST | Slugs MUST match `^[a-z0-9]+(?:-[a-z0-9]+)*$` and be 2–60 characters |
| R3 | Slug uniqueness | MUST | Duplicate slugs SHALL be rejected at the database level via unique constraint |
| R4 | Owner role assignment | MUST | Creator automatically becomes `owner` in `tenant_members` with status `active` |
| R5 | Free plan subscription | MUST | New tenant receives an `active` subscription to the `free` plan |
| R6 | Tenant limit enforcement | MUST | Users without a `business` plan SHALL be limited to 1 tenant; `business` plan holders MAY create multiple |
| R7 | Transactional integrity | SHOULD | Tenant, member, and subscription inserts SHOULD be atomic; partial success is NOT acceptable |
| R8 | Structured error response | MUST | `createTenant` MUST return `{ success: boolean, data?: Tenant, error?: string }` |
| R9 | Branding schema | MUST | The tenants table MUST include optional branding columns |
| R10 | Update tenant settings | MUST | updateTenantSettings server action to update settings |
| R11 | Settings update tests | MUST | Unit tests covering updateTenantSettings settings updates |
| R12 | Auto-provisioning of default tenant | MUST | Auto-provision a draft tenant "Mi Tienda" with random 5-char slug suffix if none exists |
| R13 | Settings Edit of Store Name and Slug | MUST | Support updating name and unique slug in updateTenantSettings |
| R14 | Store Publishing Validation | MUST | Only allow status "active" if name is not "Mi Tienda" and slug does not start with "tienda-" |
| R15 | Draft storefront restriction | MUST | Restrict public access to storefront if status is draft, showing a landing page |

### Requirement: Authenticated tenant creation

The system MUST allow authenticated users to create a tenant with a name, unique slug, and optional WhatsApp phone number. Unauthenticated requests MUST be rejected.

#### Scenario: First tenant creation succeeds

- GIVEN an authenticated user with no existing tenants
- WHEN they call `createTenant({ name: "Mi Tienda", slug: "mi-tienda" })`
- THEN a tenant record is created with status `active`
- AND a `tenant_members` record with role `owner` is inserted
- AND a `tenant_subscriptions` record linked to the `free` plan is inserted
- AND `{ success: true, data: { slug: "mi-tienda" } }` is returned

#### Scenario: Unauthenticated user is rejected

- GIVEN an unauthenticated request
- WHEN they call `createTenant({ name: "Tienda", slug: "tienda" })`
- THEN `{ success: false, error: "No autorizado" }` is returned
- AND no database records are created

#### Scenario: Duplicate slug is rejected

- GIVEN an existing tenant with slug `mi-tienda`
- WHEN another user calls `createTenant({ name: "Otra", slug: "mi-tienda" })`
- THEN `{ success: false }` is returned with a database constraint error

### Requirement: Tenant limit and plan enforcement

The system MUST enforce that free-tier users can only create one tenant. Users with an active `business` plan subscription MAY create additional tenants.

#### Scenario: Second tenant blocked for free user

- GIVEN a user with one existing tenant and no active `business` plan subscription
- WHEN they call `createTenant({ name: "Segunda", slug: "segunda" })`
- THEN `{ success: false }` is returned
- AND the error message states the plan limit

#### Scenario: Second tenant allowed for business user

- GIVEN a user with one existing tenant and an active `business` plan subscription
- WHEN they call `createTenant({ name: "Tercera", slug: "tercera" })`
- THEN `{ success: true }` is returned with the new tenant data

### Requirement: Slug server-side format validation

The system MUST validate slug format on the server before insertion. Slugs SHALL contain only lowercase alphanumerics and hyphens, start and end with alphanumeric, with no consecutive hyphens.

#### Scenario: Invalid slug characters are rejected

- GIVEN an authenticated user
- WHEN they submit a slug containing uppercase letters or underscores (e.g., `Mi_Tienda`)
- THEN the slug SHALL be rejected by the database CHECK constraint
- AND `{ success: false }` is returned

### Requirement: Branding schema

The `tenants` table MUST include optional branding columns. All columns default to `NULL` and SHALL NOT break existing tenants.

| Column | Type | Constraint |
|--------|------|-----------|
| `brand_color` | `text` | nullable |
| `secondary_color` | `text` | nullable |
| `address` | `jsonb` | nullable |
| `social_links` | `jsonb` | nullable |

#### Scenario: Existing tenant after migration

- GIVEN a tenant with no branding data
- WHEN the migration runs
- THEN all four columns exist with `NULL` values
- AND existing tenant queries continue to work.

#### Scenario: New tenant creation

- GIVEN a new tenant is created
- WHEN no branding fields are provided
- THEN `brand_color`, `secondary_color`, `address`, and `social_links` default to `NULL`.

### Requirement: Update tenant settings

The system MUST provide a server action `updateTenantSettings` that persists branding data for the authenticated user's tenant.

- The action MUST validate that the caller belongs to the target tenant via RLS.
- `brand_color` and `secondary_color` MUST be valid CSS color strings or `NULL`.
- `social_links` MUST be a JSON object with platform keys and URL values, or `NULL`.
- `address` MUST be a JSON object with keys (`street`, `city`, `state`, `zip`, `country`) or `NULL`.

The action SHALL return `{ success: true }` on success or `{ success: false, error: string }` on failure.

#### Scenario: Owner updates brand color

- GIVEN an authenticated tenant member with role `owner`
- WHEN they call `updateTenantSettings({ brand_color: "#7c3aed" })`
- THEN the tenant's `brand_color` column is set to `"#7c3aed"`
- AND the action returns `{ success: true }`.

#### Scenario: Invalid color rejected

- GIVEN an authenticated tenant member
- WHEN they call `updateTenantSettings({ brand_color: "notacolor" })`
- THEN the action returns `{ success: false, error: "Invalid brand_color format" }`.

#### Scenario: Unauthorized caller denied

- GIVEN an unauthenticated user
- WHEN they call `updateTenantSettings`
- THEN RLS blocks the mutation
- AND the action returns an error.

### Requirement: Settings update tests

Unit tests MUST cover `updateTenantSettings` for valid input, invalid color format, and RLS rejection.

#### Scenario: Valid settings persist

- GIVEN a mock tenant member context
- WHEN `updateTenantSettings` is called with valid color, address, and social_links
- THEN the database is updated with all provided values.

### Requirement: R12: Auto-provisioning of default tenant

The system MUST auto-provision a default tenant when an authenticated merchant with no existing tenants loads any dashboard page.
The default tenant:
- MUST have the name "Mi Tienda".
- MUST have the slug in the format `tienda-[id-corto]` where `[id-corto]` is a 5-character random alphanumeric string (e.g. `tienda-a1b2c`).
- MUST have status set to "draft".
- The authenticated merchant MUST be assigned as the owner of the tenant.

#### Scenario: Default tenant creation

- GIVEN an authenticated user with no existing tenants
- WHEN they load any dashboard page
- THEN the system automatically creates a tenant with name "Mi Tienda", slug matching `^tienda-[a-z0-9]{5}$`, and status "draft"
- AND the user is assigned as the owner of this tenant in `tenant_members`

### Requirement: R13: Settings Edit of Store Name and Slug

The `updateTenantSettings` action MUST support changing `name` and `slug`.
The action MUST validate that the new slug is unique. If the slug already exists for another tenant, the update MUST be rejected.

#### Scenario: Merchant updates settings with custom Name and Slug

- GIVEN an authenticated merchant owner of a tenant
- WHEN they update settings with name "Mi Tienda Personalizada" and slug "mi-tienda-personalizada"
- THEN the tenant's name is updated to "Mi Tienda Personalizada"
- AND the tenant's slug is updated to "mi-tienda-personalizada"
- AND the settings update is successful

#### Scenario: Merchant attempts to update settings with a duplicate slug

- GIVEN an authenticated merchant owner of a tenant
- AND another tenant exists with the slug "otra-tienda"
- WHEN they attempt to update their slug to "otra-tienda"
- THEN the update MUST be rejected
- AND the tenant's slug remains unchanged
- AND the action returns a failure result indicating the slug is already in use

### Requirement: R14: Store Publishing Validation

The system MUST support updating the tenant status field.
To change the status from "draft" to "active" (publishing the store), the name MUST NOT be "Mi Tienda" and the slug MUST NOT start with "tienda-".
If these conditions are not met, the transition to "active" MUST be rejected.

#### Scenario: Merchant publishes store after customizing Name and Slug

- GIVEN an authenticated merchant owner of a tenant with status "draft"
- AND the tenant's name is "Mi Tienda Pro"
- AND the tenant's slug is "mi-tienda-pro"
- WHEN they update the tenant status to "active"
- THEN the update is successful and the tenant status becomes "active"

#### Scenario: Merchant attempts to publish store with default Name

- GIVEN an authenticated merchant owner of a tenant with status "draft"
- AND the tenant's name is "Mi Tienda"
- AND the tenant's slug is "mi-tienda-pro"
- WHEN they attempt to update the tenant status to "active"
- THEN the update MUST be rejected
- AND the tenant status remains "draft"

#### Scenario: Merchant attempts to publish store with default Slug prefix

- GIVEN an authenticated merchant owner of a tenant with status "draft"
- AND the tenant's name is "Mi Tienda Pro"
- AND the tenant's slug starts with "tienda-" (e.g., "tienda-a1b2c")
- WHEN they attempt to update the tenant status to "active"
- THEN the update MUST be rejected
- AND the tenant status remains "draft"

### Requirement: R15: Draft storefront restriction

The system MUST restrict public access to the storefront of a tenant whose status is "draft".
- If a public user visits the storefront of a tenant and its status is "draft", the system MUST show a clean "Tienda en construcción" landing page instead of the normal catalog.
- If a public user visits the storefront of a tenant and its status is "active", the system MUST display the normal catalog.

#### Scenario: Public visitor opens storefront of a draft tenant

- GIVEN a tenant with status "draft"
- WHEN a public visitor opens the storefront for this tenant
- THEN the system displays a "Tienda en construcción" landing page
- AND the visitor does not see the normal product catalog

#### Scenario: Public visitor opens storefront of an active tenant

- GIVEN a tenant with status "active"
- WHEN a public visitor opens the storefront for this tenant
- THEN the system displays the normal product catalog
