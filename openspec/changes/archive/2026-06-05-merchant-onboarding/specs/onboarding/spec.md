# Onboarding Specification

## Purpose

UI flow for authenticated users to create their first shop via the `/onboarding` page, including real-time slug validation and form submission with loading feedback.

## Requirements

| # | Requirement | Strength | Summary |
|---|------------|----------|---------|
| R1 | Onboarding form fields | MUST | Form SHALL collect name, slug, and optional WhatsApp phone |
| R2 | Real-time slug availability | SHOULD | Slug field SHOULD validate availability via server check on blur/change |
| R3 | Client-side slug format | MUST | Form MUST validate slug format client-side before submission |
| R4 | Submit to createTenant | MUST | Form submission SHALL call the `createTenant` server action |
| R5 | Loading and error states | MUST | UI MUST show loading indicator during submission and display errors via toast |
| R6 | Success redirection | MUST | On success, user SHALL be redirected to `/dashboard/[slug]` |
| R7 | Authentication gate | MUST | Unauthenticated users SHALL be redirected to login before reaching `/onboarding` |

### Requirement: Onboarding form

The `/onboarding` page MUST present a form with fields for shop name (required, 2–120 chars), slug (required, auto-generated from name with manual override), and WhatsApp phone (optional). The form MUST use shadcn/ui components.

#### Scenario: User fills and submits valid form

- GIVEN an authenticated user on `/onboarding`
- WHEN they enter a valid name, a unique slug, and optional WhatsApp
- AND they submit the form
- THEN `createTenant` is called with the form data
- AND a loading state is shown during submission
- AND on success, the user is redirected to `/dashboard/[slug]`

#### Scenario: Slug already taken

- GIVEN an authenticated user on `/onboarding`
- WHEN they type a slug that already exists
- THEN an availability check SHALL indicate the slug is unavailable
- AND the submit button SHALL remain disabled until a valid unique slug is provided

#### Scenario: Submission error

- GIVEN an authenticated user on `/onboarding`
- WHEN the `createTenant` call fails
- THEN an error toast SHALL display the server error message
- AND the form SHALL remain editable for correction

### Requirement: Real-time slug validation

The form SHOULD check slug availability as the user types (debounced) or on blur. Available slugs SHALL show a success indicator; taken slugs SHALL show an error message.

#### Scenario: Slug availability check succeeds

- GIVEN a user typing a slug `mi-sucursal-nueva`
- WHEN the availability check returns no conflict
- THEN a green checkmark or "Available" message is displayed next to the slug field

#### Scenario: Slug availability check fails

- GIVEN a user typing a slug `tienda-existente` that is already taken
- WHEN the availability check returns a conflict
- THEN a red "Already taken" error message is displayed

### Requirement: Authentication gate

The `/onboarding` route MUST redirect unauthenticated users to the login page. Only authenticated users without an existing tenant SHALL access the onboarding form. Users who already have a tenant SHALL be redirected to `/dashboard/[slug]`.

#### Scenario: Authenticated user accesses onboarding

- GIVEN an authenticated user with no existing tenants
- WHEN they navigate to `/onboarding`
- THEN the onboarding form is rendered

#### Scenario: Unauthenticated user is redirected

- GIVEN an unauthenticated visitor
- WHEN they navigate to `/onboarding`
- THEN they are redirected to `/login`
