# Proposal: Add Categories and Subcategories (3 Levels)

## Overview
Add support for a 3-level hierarchical category system (Categoría -> Subcategoría -> Tercer Nivel) in the products module, allowing store owners to organize their products with three levels of categorization.

## Assumptions & Requirements
* Based on user input: *"solo sub catergori, subcategoria y una tercera categoria que se puede escribir por el dueño de cada tienda"*
* There will be exactly 3 levels of nesting supported in the UI:
  1. **Categoría Principal (Level 1)**
  2. **Subcategoría (Level 2)** (parent points to Level 1)
  3. **Tercera Categoría (Level 3)** (parent points to Level 2)
* The category owner can create categories at any level directly from the product form dashboard.
* Products will be assigned to a category. If a product belongs to a subcategory or third-level category, it is assigned directly to that specific category ID in the database (`products.category_id`).

## Database Design
We will add a self-referencing foreign key `parent_id` to the `categories` table:
```sql
ALTER TABLE public.categories 
  ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;
```
This is fully compatible with existing RLS rules since categories inherit their parent's safety policies via `tenant_id`.

## User Interface (Dashboard Modal)
* In the product form modal:
  * Cascade selection of categories across 3 Select dropdowns.
  * When editing a product, dynamically resolve the 3 levels from the product's `category_id`.
  * In the creation sub-form: allow creating a new category and setting its parent category (optionally Level 1 or Level 2).

## User Interface (Storefront Catalog)
* On the public storefront:
  * Display Level 1 categories as the main selector.
  * If a selected Level 1 category has children, display a secondary filter bar (pills) showing its Level 2 subcategories.
  * If a selected Level 2 subcategory has children, display Level 3 options.
  * Show products matching the selected category or any of its sub-categories.

## Proposed Files
* `supabase/migrations/20260608000000_categories_subcategories.sql` (new migration)
* `src/lib/products/actions.ts` (types and server actions)
* `src/components/dashboard/product-form-modal.tsx` (management modal)
* `src/components/storefront/storefront-catalog.tsx` (public storefront)
