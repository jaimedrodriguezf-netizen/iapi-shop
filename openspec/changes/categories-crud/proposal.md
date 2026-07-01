# Proposal: CRUD de Categorías con Comentarios

## Intent

Actualmente el dashboard no permite gestionar las categorías de forma independiente, y las categorías no soportan descripciones/comentarios adicionales. Necesitamos una página dedicada para crear, editar, eliminar y visualizar categorías, y extender el esquema para incluir un "comentario de texto" en todos los niveles.

## Scope

### In Scope
- Modificar el esquema de la base de datos (Supabase) agregando el campo `description` tipo `text` a la tabla `categories`.
- Actualizar el tipo `Category` y las funciones backend (`createCategory`, agregar `updateCategory`, `deleteCategory`).
- Crear la página de gestión `/dashboard/categories` con una tabla jerárquica o lista.
- Crear un modal para edición/creación que incluya el campo "Descripción/Comentario" y el nivel jerárquico.
- Agregar "Categorías" al `AppSidebar`.

### Out of Scope
- Reorganizar visualmente el catálogo público de la tienda.
- Paginación compleja (se asumirá que las tiendas no tienen más de 100-500 categorías).

## Capabilities

### New Capabilities
- `categories-management`: Gestión independiente de categorías de productos, permitiendo edición de descripciones y jerarquías (hasta 3 niveles).

### Modified Capabilities
- None

## Approach

1. **Migración DB:** Generar y aplicar un archivo SQL para `ALTER TABLE categories ADD COLUMN description text;`.
2. **Backend:** Modificar `src/lib/products/actions.ts` para exponer CRUD completo y procesar `description`.
3. **UI:** Crear `src/app/dashboard/categories/page.tsx` con componentes de cliente (`category-list.tsx`, `category-modal.tsx`) que consuman las server actions.
4. **Sidebar:** Insertar el ícono en `AppSidebar`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations` | New | Agregar script para nueva columna. |
| `src/lib/products/actions.ts` | Modified | Nuevas Server Actions para update y delete, y soportar `description`. |
| `src/app/dashboard/categories/page.tsx` | New | Página base. |
| `src/components/dashboard/app-sidebar.tsx` | Modified | Nuevo ítem de navegación. |
| `src/components/dashboard/product-form-modal.tsx` | Modified | Ajustar la creación rápida para soportar `description`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Eliminación accidental de categoría con productos asociados | Medium | Bloquear el borrado si hay productos vinculados, o definir en NULL el `category_id`. Lo bloquearemos. |

## Rollback Plan

- Revertir los commits de UI y backend.
- Eliminar la columna `description` de la base de datos si causa problemas (opcional).

## Success Criteria

- [ ] El menú lateral muestra "Categorías".
- [ ] El administrador puede ver, crear, editar y eliminar categorías.
- [ ] Todas las categorías (independiente del nivel) pueden guardar y mostrar un comentario de texto.
- [ ] El límite de 3 niveles se respeta en la nueva UI.
