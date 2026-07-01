# Spec: Gestión de Categorías

## Requirements

### Roles and Permissions
- `merchant` (o rol superior del tenant) puede leer, crear, editar y eliminar categorías de su propio `tenant_id`.
- Las categorías no pueden modificarse desde otros tenants.

### Data Validation
- `name`: string, obligatorio, 1 a 50 caracteres.
- `description`: string, opcional, máximo 500 caracteres (nuevo campo para comentarios).
- `parent_id`: string (UUID), opcional, debe corresponder a una categoría válida del mismo tenant.
- Jerarquía: Máximo 3 niveles (Padre -> Hijo -> Nieto). No se permite un 4to nivel.

### Interactions
- Si se intenta eliminar una categoría que está siendo utilizada por productos (`category_id`), se debe rechazar la acción informando al usuario, a menos que primero se desasignen esos productos.
- Si se elimina una categoría padre, el comportamiento esperado (por seguridad de consistencia) es que se bloquee si tiene subcategorías, o que se requiera borrar o reasignar las subcategorías primero. Optamos por bloquear la eliminación si tiene subcategorías asociadas.

### Rate Limits
- La creación de categorías mantiene un límite de 10 por minuto por IP (ya existente).

## Data Schema

**Table:** `categories`
- `id` (uuid, pk)
- `tenant_id` (uuid, fk -> tenants)
- `name` (text, not null)
- `slug` (text, not null)
- `parent_id` (uuid, fk -> categories, nullable)
- `description` (text, nullable) <!-- Nuevo campo -->
- `created_at` (timestamptz)

**Indexes:**
- `tenant_id`
- `parent_id`
