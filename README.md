# IAPI Shop

Plataforma ecommerce multitenant para tiendas ecuatorianas con acceso seguro por roles, QR por tienda, WhatsApp, PayPal/manual, imágenes en Hostinger e IA con cobro por uso.

## Stack

- Next.js 16 App Router + TypeScript + Tailwind CSS
- Supabase Auth/Postgres/RLS
- OpenAI SDK oficial
- Upstash Redis Rate Limit
- Cloudflare Turnstile
- PayPal Ecuador
- Hostinger como origen de imágenes/QR
- Vitest + Testing Library + Playwright

## Seguridad base

- Usuarios anónimos solo pueden ver la landing pública `/`.
- Productos, tiendas, marketplace, checkout, dashboard y admin requieren autenticación.
- El acceso interno se limita por `tenant_id`, rol y RLS.
- `service_role` y credenciales externas solo se usan en servidor.

## Scripts

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## SDD

El cambio inicial está en `openspec/changes/foundation-secure-multitenant/` y el proyecto usa Strict TDD.
