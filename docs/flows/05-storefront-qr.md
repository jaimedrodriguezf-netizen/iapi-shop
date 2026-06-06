# Storefront QR

**Tareas**: 10  
**Complejidad**: Media  
**Prioridad**: 3

## Objetivo

Crear la cara pública de la plataforma donde clientes ven el catálogo y contactan por WhatsApp.

## Flujo principal

```
Merchant → Dashboard QR → /dashboard/qr
       ↓
Genera QR code para su storefront
  ├─ URL: https://iapi.shop/[slug]
  ├─ Descarga PNG/SVG
  └─ Muestra preview
       ↓
Cliente escanea QR → /app/[slug]
       ↓
Página pública:
  ├─ Header con logo y nombre
  ├─ Filtro por categorías (chips)
  ├─ Grid de productos (mobile-first)
  │   ├─ Imagen, nombre, precio
  │   └─ Botón "Pedir por WhatsApp"
  └─ SEO metadata (Open Graph)
       ↓
Click "Pedir" → wa.me/[phone]?text=[producto]
```

## Archivos clave

- `src/app/dashboard/qr/page.tsx` (nuevo)
- `src/app/[slug]/page.tsx` (nuevo)
- `src/lib/qr.ts` (nuevo)
- `src/components/storefront/product-card.tsx` (nuevo)

## Consideraciones

- Optimizar para mobile (la mayoría de scans de QR vienen de móviles)
- Implementar lazy loading para imágenes de productos
- Generar metadata Open Graph para compartir en redes sociales
- Manejar el caso de slug no encontrado (404 personalizado)
- Evitar colisiones de rutas con paths internos de Next.js
