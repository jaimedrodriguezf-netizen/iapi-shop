# Tenants Branding Specification

## Purpose

Branding fields on the `tenants` table and the server actions that mutate them.

## Requirements

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
