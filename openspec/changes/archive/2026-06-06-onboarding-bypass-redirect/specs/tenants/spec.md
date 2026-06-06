# Delta for Tenants

## ADDED Requirements

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
