# Dashboard Settings Specification

## Purpose

Branding configuration page at `/dashboard/settings` for tenant owners and admins.

## Requirements

### Requirement: Settings page access

The `/dashboard/settings` page MUST be accessible only to authenticated tenant members. Access control SHALL follow the tenant role permissions defined in the security spec.

#### Scenario: Owner accesses settings

- GIVEN a tenant member with role `owner` or `admin`
- WHEN they navigate to `/dashboard/settings`
- THEN the page renders with the branding form.

#### Scenario: Viewer denied access

- GIVEN a tenant member with role `viewer`
- WHEN they navigate to `/dashboard/settings`
- THEN access is denied.

### Requirement: Brand color picker

The settings form MUST include a color input for `brand_color`. The component SHALL display a curated color palette AND accept a freeform hex value.

#### Scenario: Select a curated color

- GIVEN the settings page is open
- WHEN the user clicks a color from the curated palette
- THEN the color picker value updates
- AND the live preview reflects the selection immediately.

#### Scenario: Enter custom hex

- GIVEN the settings page is open
- WHEN the user types `#7c3aed` into the hex input
- THEN the color is accepted
- AND the preview updates.

### Requirement: Contact info and social links

The form MUST include fields for `address` (street, city, state, zip, country) and `social_links` (dynamic platform-name + URL pairs). Users SHALL be able to add and remove social link entries.

#### Scenario: Add social link

- GIVEN the settings page is open
- WHEN the user adds a social link with platform "Instagram" and URL "https://instagram.com/example"
- THEN the entry appears in the form
- AND the live preview shows the link.

#### Scenario: Remove social link

- GIVEN a social link "Instagram" exists in the form
- WHEN the user clicks remove on that entry
- THEN the entry is removed from the form and preview.

### Requirement: Live preview

A preview panel MUST show a miniature storefront reflecting the current form state. It SHALL update reactively as the user changes the brand color, address, and social links — without requiring a save.

#### Scenario: Preview reflects color change

- GIVEN the settings page with a blank `brand_color`
- WHEN the user selects `#22c55e`
- THEN the preview's buttons and highlights render in `#22c55e`.

### Requirement: Save and feedback

Submitting the form MUST call `updateTenantSettings`. On success, a toast notification SHALL confirm "Settings saved". On failure, an error toast SHALL display the error message.

#### Scenario: Successful save

- GIVEN valid settings are configured
- WHEN the user clicks Save
- THEN a success toast appears
- AND the values persist across page reload.

#### Scenario: Save failure

- GIVEN a network error occurs
- WHEN the user clicks Save
- THEN an error toast appears with the failure reason.
