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
