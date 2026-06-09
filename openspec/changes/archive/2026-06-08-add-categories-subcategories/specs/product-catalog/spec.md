# Specification: Categories and Subcategories (3 Levels)

## Purpose

Add support for a 3-level hierarchical category system (Categoría -> Subcategoría -> Tercera Categoría) in the products module, allowing store owners to organize their products with three levels of categorization.

## Requirements

### Requirement: Category Hierarchy Support

The system SHALL support self-referencing hierarchy in categories via a nullable `parent_id` column. RLS policies and validations MUST ensure that the parent category belongs to the same tenant as the child category.

#### Scenario: Create a subcategory (Level 2)
- GIVEN a tenant "tenant-123" with an existing Level 1 category "Bebidas"
- WHEN `createCategory` is called for "tenant-123" with name "Gaseosas" and `parent_id` pointing to "Bebidas"
- THEN a category "Gaseosas" is created with `parent_id` referencing "Bebidas".

#### Scenario: Create a third-level category (Level 3)
- GIVEN a tenant "tenant-123" with a Level 2 category "Gaseosas"
- WHEN `createCategory` is called for "tenant-123" with name "Colas" and `parent_id` pointing to "Gaseosas"
- THEN a category "Colas" is created with `parent_id` referencing "Gaseosas".

### Requirement: Hierarchy Limit (3 Levels)

The user interface MUST restrict category depth to exactly 3 levels (Level 1 -> Level 2 -> Level 3). The category creation UI SHALL only allow selecting parent categories that are at Level 1 or Level 2.

#### Scenario: Limit parent options in UI
- GIVEN a tenant with categories at Level 1, Level 2, and Level 3
- WHEN loading parent category options in the creation form
- THEN only Level 1 and Level 2 categories are presented as options.

### Requirement: Product Association

A product SHALL associate with a single category via `category_id`. If a product belongs to a subcategory or third-level category, `products.category_id` MUST hold the UUID of that specific leaf category.

#### Scenario: Save product with leaf category
- GIVEN a product form with Level 3 category "Colas" selected
- WHEN the product is saved
- THEN the product is persisted with `category_id` set to the UUID of "Colas".

### Requirement: Storefront Filtering by Category Hierarchy

The storefront catalog filter MUST recursively include products from all child categories when a parent category is selected.

#### Scenario: Filter by Level 1 category
- GIVEN product A in Level 1 category "Bebidas"
- AND product B in Level 2 category "Gaseosas" (child of "Bebidas")
- AND product C in Level 3 category "Colas" (child of "Gaseosas")
- WHEN a user selects the "Bebidas" category filter
- THEN products A, B, and C are returned.

#### Scenario: Filter by Level 2 category
- GIVEN product A in Level 1 category "Bebidas"
- AND product B in Level 2 category "Gaseosas" (child of "Bebidas")
- AND product C in Level 3 category "Colas" (child of "Gaseosas")
- WHEN a user selects the "Gaseosas" category filter
- THEN products B and C are returned
- AND product A is excluded.
