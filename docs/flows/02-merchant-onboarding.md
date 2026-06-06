# Merchant Onboarding

**Tareas**: 8  
**Complejidad**: Baja  
**Prioridad**: 1 (primero)

## Objetivo

Permitir a usuarios autenticados crear su primer "Shop" (Tenant).

## Flujo principal

```
Usuario autenticado → /onboarding
       ↓
Formulario:
  ├─ Nombre del shop
  ├─ Slug (validación en tiempo real)
  └─ WhatsApp
       ↓
Server Action: createTenant()
  ├─ INSERT en tenants
  ├─ INSERT en tenant_members (role: owner)
  └─ INSERT en tenant_subscriptions (plan: free)
       ↓
Redirect → /dashboard/[slug]
```

## Archivos clave

- `src/app/onboarding/page.tsx` (nuevo)
- `src/lib/tenants/actions.ts` (nuevo)
- `src/lib/hooks/use-debounce.ts` (nuevo)

## Consideraciones

- Validar unicidad del slug en tiempo real con debounce
- Manejar errores de concurrencia si dos usuarios intentan el mismo slug
- Asegurar transacción atómica para las 3 inserciones
