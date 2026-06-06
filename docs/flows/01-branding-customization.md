# Branding Customization

**Tareas**: 13  
**Complejidad**: Media  
**Prioridad**: 5 (último)

## Objetivo

Permitir a merchants personalizar la apariencia visual de su storefront.

## Flujo principal

```
Merchant → Dashboard Settings → Formulario de branding
  ├─ Color primario (brand_color)
  ├─ Color secundario (secondary_color)
  ├─ Dirección (address - JSONB)
  └─ Redes sociales (social_links - JSONB)
       ↓
Server Action: updateTenantSettings()
       ↓
Storefront público /[slug] inyecta CSS variables
  ├─ Botones usan --brand-color
  ├─ Footer muestra contacto
  └─ Header muestra logo
```

## Archivos clave

- `src/app/dashboard/settings/page.tsx` (nuevo)
- `src/lib/tenants/actions.ts` (modificar)
- `src/app/[slug]/page.tsx` (modificar)

## Consideraciones

- Validar contraste de colores para accesibilidad
- Proporcionar paletas predefinidas como fallback
- Asegurar que los cambios se reflejen instantáneamente en el storefront
