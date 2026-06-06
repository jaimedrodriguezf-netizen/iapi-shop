# Product Catalog

**Tareas**: 11  
**Complejidad**: Alta  
**Prioridad**: 2

## Objetivo

Permitir a merchants gestionar productos y categorías.

## Flujo principal

```
Merchant → Dashboard Products → /dashboard/products
       ↓
Vista: DataTable con productos
  ├─ Filtro por categoría
  ├─ Búsqueda por nombre
  └─ Paginación
       ↓
Acciones:
  ├─ Crear categoría (modal)
  ├─ Crear producto (modal)
  │   ├─ Nombre, precio, stock
  │   ├─ Categoría (select)
  │   ├─ Descripción (textarea)
  │   └─ Botón "Generar con IA" → OpenAI API
  ├─ Editar producto
  └─ Eliminar producto
       ↓
Server Actions:
  ├─ createCategory()
  ├─ createProduct()
  ├─ updateProduct()
  └─ deleteProduct()
```

## Archivos clave

- `src/app/dashboard/products/page.tsx` (nuevo)
- `src/lib/products/actions.ts` (nuevo)
- `src/lib/ai/actions.ts` (nuevo)
- `supabase/migrations/*_product_catalog.sql` (nuevo)

## Consideraciones

- Implementar rate limiting para la API de OpenAI
- Validar que los productos pertenezcan al tenant actual (RLS)
- Manejar imágenes con URLs externas (no upload directo aún)
- Considerar límites de productos por plan de suscripción
