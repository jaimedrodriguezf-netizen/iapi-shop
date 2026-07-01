# Design: CRUD de Categorías con Comentarios

## Architectures & Patterns

- **UI Framework:** Next.js App Router, Shadcn UI para modales, tablas y formularios. Zod para validación. Server Actions para el backend.
- **Form State:** `react-hook-form` con `@hookform/resolvers/zod` para el formulario del modal.
- **Feedback:** `sonner` para tostadas de éxito/error al realizar acciones CRUD.

## Components & File Structure

1. **`supabase/migrations/<timestamp>_add_category_description.sql`**
   - Agrega la columna `description text` a `categories`.

2. **`src/lib/products/actions.ts`**
   - Extender interfaz `Category` con `description?: string | null`.
   - Modificar `createCategory` para aceptar `description`.
   - Crear `updateCategory(tenant_id, category_id, name, description, parent_id)`.
   - Crear `deleteCategory(tenant_id, category_id)` con chequeo de productos asociados.

3. **`src/app/dashboard/categories/page.tsx`**
   - Server Component.
   - Llama a `getCategories(tenantId)`.
   - Renderiza un título, botón "Crear Categoría" y el componente cliente `CategoriesClient`.

4. **`src/app/dashboard/categories/categories-client.tsx`**
   - Client Component. Recibe `categories: Category[]`.
   - Renderiza una tabla o una lista anidada visualizando la jerarquía.
   - Tiene estados para `isModalOpen`, `selectedCategory` (para editar).
   - Componentes hijos: `CategoryModal`, `DeleteCategoryDialog`.

5. **`src/app/dashboard/categories/category-modal.tsx`**
   - Client Component para el formulario.
   - Campos: `name` (text), `parent_id` (select jerárquico), `description` (textarea).
   - Modo "Crear" o "Editar".
   - Al guardar llama a `createCategory` o `updateCategory`, y hace `router.refresh()`.

6. **`src/components/dashboard/app-sidebar.tsx`**
   - Añadir el objeto al array `navItems` con el ícono `Tags` o `ListTree`.

## Edge Cases

- **Circular references (parent_id = self.id):** Se evitará en UI al no permitir seleccionar la propia categoría como padre en edición. Además el backend lo podría validar.
- **Deep nesting limit:** En el backend, al editar el `parent_id`, también se validará que no se rompa la regla de 3 niveles.
- **Eliminar con dependencias:** El backend de `deleteCategory` debe hacer un query primero verificando `select id from products where category_id = input_id limit 1`. Si retorna algo, falla con "Tiene productos asignados".

## Dependencies
- Se reusarán los componentes de diseño (Button, Input, Textarea, Select, Table, Dialog, etc.) de `shadcn` que ya existen en el proyecto.
