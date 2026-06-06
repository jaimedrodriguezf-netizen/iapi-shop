# Dashboard Products Specification

## Purpose

Merchant dashboard UI for managing the product catalog: product list with searchable DataTable, add/edit product dialog with validation, and AI-assisted description generation.

## Requirements

### Requirement: Product list page with DataTable

The system SHALL provide `/dashboard/products` with a searchable, paginated data table listing all products for the authenticated user's tenant.

#### Scenario: Product list loads with tenant data

- GIVEN an authenticated merchant belonging to "tenant-123"
- WHEN they navigate to `/dashboard/products`
- THEN a DataTable displays all products for "tenant-123"
- AND each row shows name, category, price, and status.

#### Scenario: Search filters products

- GIVEN the product list is displayed
- WHEN the user types a search term
- THEN only products matching the term are shown.

### Requirement: Add Product dialog with validation

The system SHALL provide a dialog/modal for creating products with client-side validation on required fields (name, price).

#### Scenario: Valid product creation

- GIVEN the "Add Product" dialog is open
- WHEN the user fills name, price, and optionally category/description/images
- AND clicks submit
- THEN the product is created via server action
- AND a success toast is shown.

#### Scenario: Validation prevents empty submission

- GIVEN the "Add Product" dialog is open
- WHEN the user submits without filling the name field
- THEN a validation error is displayed
- AND no server action is called.

### Requirement: AI description generation button

The system SHALL provide a "Generate with IA" button adjacent to the description textarea. Pressing it SHALL call the AI description endpoint with the current product name and selected category.

#### Scenario: AI generation fills description

- GIVEN the "Add Product" form has name "Hamburguesa" and category "Comida"
- WHEN the user clicks "Generate with IA"
- THEN a loading state is shown
- AND the description textarea is populated with the generated text on success.

#### Scenario: AI generation fails gracefully

- GIVEN the AI endpoint returns an error
- WHEN the user clicks "Generate with IA"
- THEN an error toast is displayed
- AND the description field remains unchanged.

### Requirement: Visual identity compliance

The dashboard UI MUST use the project's violet primary color (`oklch(0.602 0.218 275.52)`), `rounded-3xl` for main containers, `rounded-xl` for small elements, and support light/dark mode via CSS variables.

#### Scenario: Dark mode renders correctly

- GIVEN the system preference is dark mode
- WHEN the product dashboard is rendered
- THEN all components use dark theme colors
- AND text remains readable.

### Requirement: Toast feedback for async operations

Every async operation (create, update, delete) SHALL provide visual feedback via `sonner` toasts.

#### Scenario: Delete product shows confirmation and toast

- GIVEN the product list is displayed
- WHEN the user deletes a product
- THEN a success toast confirms the deletion
- AND the product is removed from the list.
