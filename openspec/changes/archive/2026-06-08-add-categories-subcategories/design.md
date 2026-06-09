# Technical Design: Categories and Subcategories (3 Levels)

## 1. Database Schema
We will create a migration `supabase/migrations/20260608000000_categories_subcategories.sql`:
```sql
-- Migration: Categories Hierarchy Support
-- Add parent_id to categories

ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Index for fast parent queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- RLS check is already handled by tenant_id, but add comment
COMMENT ON COLUMN public.categories.parent_id IS 'Parent category for subcategories (null for top-level categories)';
```

## 2. Server Actions & Interfaces
In `src/lib/products/actions.ts`:
* Extend the `Category` interface:
  ```typescript
  export interface Category {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    parent_id?: string | null;
    created_at?: string;
  }
  ```
* Update `createCategory`:
  ```typescript
  export async function createCategory(
    tenant_id: string,
    name: string,
    parent_id?: string | null
  ): Promise<{ success: boolean; category?: Category; error?: string }>
  ```

## 3. UI Components

### Product Form Modal (`src/components/dashboard/product-form-modal.tsx`)
* **Cascading Selectors:**
  * When rendering `TabsContent value="category"`, we will replace the single `FormField name="category_id"` with three selector fields (Level 1, Level 2, Level 3).
  * State variables to track:
    * `selectedLevel1Id`: string | undefined
    * `selectedLevel2Id`: string | undefined
    * `selectedLevel3Id`: string | undefined
  * When editing a product:
    * Look up its `category_id` in the `categories` array.
    * If found:
      * If it has a `parent_id`:
        * Check if the parent also has a `parent_id` (grandparent).
        * If grandparent exists: `selectedLevel3Id = category_id`, `selectedLevel2Id = parent_id`, `selectedLevel1Id = grandparent_id`.
        * If no grandparent: `selectedLevel2Id = category_id`, `selectedLevel1Id = parent_id`, `selectedLevel3Id = ""`.
      * If it has no `parent_id`: `selectedLevel1Id = category_id`, `selectedLevel2Id = ""`, `selectedLevel3Id = ""`.
  * Form Submit:
    * Map the selected values to `category_id` form value:
      `form.setValue("category_id", selectedLevel3Id || selectedLevel2Id || selectedLevel1Id || "")`
* **Create Category Sub-form:**
  * Add a new select dropdown: `¿Depende de otra categoría?` (Parent category selector).
  * It will list all categories (Level 1 and Level 2) so the owner can add a subcategory or Level 3 category.
  * When submitting `handleCreateCategory`, pass the selected parent category ID.

### Storefront Catalog (`src/components/storefront/storefront-catalog.tsx`)
* Update filtering logic:
  * When a Level 1 category is selected, collect all its child category IDs (Level 2 and Level 3).
  * Filter products where `product.category_id` matches the Level 1 category ID, or any of the Level 2/3 child category IDs.
  * Render a second row of tabs/pills displaying Level 2 subcategories of the selected Level 1 category.
  * If a Level 2 subcategory is selected, render a third row of small pills/tags for Level 3 categories.
