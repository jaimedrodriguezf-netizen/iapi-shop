# 🧪 Test E2E Manual - Storefront QR

**Fecha**: 2026-06-05  
**Módulo**: Storefront QR  
**URL Base**: http://localhost:3000

---

## 📋 Pre-requisitos

1. ✅ Servidor de desarrollo corriendo (`npm run dev`)
2. ✅ Base de datos con migraciones aplicadas
3. ✅ Usuario autenticado con rol de merchant
4. ✅ Al menos 1 tenant con productos creados
5. ✅ Categoría(s) creada(s) con productos asignados

---

## 🎯 Escenario 1: Generar Código QR desde Dashboard

### Pasos

1. **Login** como merchant
   - Email: `vendedor@iapi.shop`
   - Password: (la que configuraste)
   - Deberías llegar a `/dashboard`

2. **Navegar a Códigos QR**
   - Click en "Códigos QR" en el sidebar
   - URL esperada: `/dashboard/qr`
   - Deberías ver una página con el QR generado

3. **Verificar QR generado**
   - El QR debe estar visible en la página
   - Debe mostrar la URL del storefront: `http://localhost:3000/[tu-slug]`
   - Verifica que el QR sea escaneable (usa tu celular para probar)

4. **Descargar QR**
   - Busca el botón "Descargar QR" o similar
   - Click en el botón
   - Debería descargarse un archivo PNG o SVG
   - Verifica que el archivo se descargó correctamente

### ✅ Resultado esperado
- QR generado y visible en dashboard
- QR descargable en formato imagen
- URL del QR apunta al storefront correcto

---

## 🎯 Escenario 2: Ver Storefront Público

### Pasos

1. **Obtener URL del storefront**
   - Desde `/dashboard/qr`, copia la URL del storefront
   - O usa: `http://localhost:3000/[tu-slug]`
   - Reemplaza `[tu-slug]` con el slug de tu tenant

2. **Abrir storefront en nueva pestaña**
   - Navega a la URL del storefront
   - **NO necesitas estar autenticado** (es público)

3. **Verificar página del storefront**
   - Deberías ver:
     - **Header**: Logo del tenant + nombre
     - **Filtros de categoría**: Chips/botones con las categorías
     - **Grid de productos**: Tarjetas con imagen, nombre, precio
   - Verifica que solo se muestran productos de ESTE tenant

4. **Verificar metadata SEO**
   - Click derecho → "Ver código fuente" o Ctrl+U
   - Busca tags Open Graph:
     - `<meta property="og:title" content="[nombre del tenant]">`
     - `<meta property="og:description" content="...">`
     - `<meta property="og:image" content="...">`

### ✅ Resultado esperado
- Storefront público accesible sin autenticación
- Solo muestra productos del tenant correcto
- Metadata SEO presente para compartir en redes

---

## 🎯 Escenario 3: Filtrar Productos por Categoría

### Pasos

1. **En el storefront público** (`/[slug]`)
   - Verifica que hay productos en múltiples categorías
   - Si no, crea más productos en diferentes categorías primero

2. **Click en filtro de categoría**
   - Busca los chips/botones de categorías en la parte superior
   - Click en una categoría específica (ej: "Electrónica")

3. **Verificar filtrado**
   - Solo deberían mostrarse productos de esa categoría
   - El chip de la categoría seleccionada debe estar destacado

4. **Cambiar a otra categoría**
   - Click en otra categoría (ej: "Ropa")
   - Verifica que cambien los productos mostrados

5. **Ver todos los productos**
   - Click en "Todos" o similar
   - Deberían mostrarse todos los productos nuevamente

### ✅ Resultado esperado
- Filtrado por categoría funciona correctamente
- Solo se muestran productos de la categoría seleccionada
- UI indica claramente qué categoría está activa

---

## 🎯 Escenario 4: Botón WhatsApp por Producto

### Pasos

1. **En el storefront público** (`/[slug]`)
   - Busca una tarjeta de producto
   - Debería tener un botón "Pedir por WhatsApp" o ícono de WhatsApp

2. **Click en botón WhatsApp**
   - Click en el botón de WhatsApp del producto
   - Debería abrirse WhatsApp Web o la app de WhatsApp

3. **Verificar mensaje pre-llenado**
   - El mensaje debe incluir:
     - Nombre del producto
     - Precio
     - Nombre del tenant/tienda
   - Ejemplo: "Hola! Me interesa el producto: Auriculares Bluetooth ($29.99) de Tienda IAPI"

4. **Verificar número de teléfono**
   - El mensaje debe enviarse al número de WhatsApp del tenant
   - Verifica que sea el número correcto (el que configuraste en onboarding)

### ✅ Resultado esperado
- Botón WhatsApp visible en cada producto
- Al hacer click, abre WhatsApp con mensaje pre-llenado
- Mensaje incluye nombre, precio y tienda
- Número de teléfono es el correcto del tenant

---

## 🎯 Escenario 5: Escanear QR con Celular

### Pasos

1. **Descarga el QR** desde `/dashboard/qr`
   - O toma una captura de pantalla del QR en el dashboard

2. **Escanea el QR con tu celular**
   - Usa la cámara de tu celular
   - O usa una app de escaneo de QR

3. **Verificar redirección**
   - Debería abrirse la URL del storefront en el navegador del celular
   - URL: `http://localhost:3000/[tu-slug]`
   - **Nota**: Si estás en localhost, el celular no podrá acceder. Para probar esto:
     - Opción A: Usa ngrok o similar para exponer localhost
     - Opción B: Despliega a un dominio temporal (Vercel, Netlify)
     - Opción C: Verifica que la URL del QR sea correcta (aunque no puedas acceder desde el celular)

4. **Verificar storefront en móvil**
   - El storefront debe ser mobile-first
   - Verifica que:
     - Los productos se ven bien en pantalla pequeña
     - Los botones de WhatsApp son fáciles de tocar
     - El filtrado por categoría funciona en móvil

### ✅ Resultado esperado
- QR es escaneable y redirige al storefront correcto
- Storefront se ve bien en móvil (responsive)
- Todos los botones y filtros funcionan en móvil

---

## 🎯 Escenario 6: Compartir Storefront en Redes Sociales

### Pasos

1. **Copia la URL del storefront**
   - `http://localhost:3000/[tu-slug]`

2. **Prueba en Facebook Debugger** (opcional)
   - Ve a: https://developers.facebook.com/tools/debug/
   - Pega la URL del storefront
   - Click en "Debug"
   - Verifica que muestre:
     - Título correcto (nombre del tenant)
     - Descripción correcta
     - Imagen correcta (logo del tenant)

3. **Prueba en Twitter Card Validator** (opcional)
   - Ve a: https://cards-dev.twitter.com/validator
   - Pega la URL del storefront
   - Verifica que muestre la tarjeta correcta

4. **Prueba manual** (si tienes acceso a redes)
   - Comparte la URL en Facebook, Twitter, o WhatsApp
   - Verifica que se muestre la preview con:
     - Logo del tenant
     - Nombre del tenant
     - Descripción apropiada

### ✅ Resultado esperado
- Metadata Open Graph presente y correcta
- Al compartir en redes, se muestra preview con logo, nombre y descripción
- Imagen del logo se carga correctamente

---

## 🎯 Escenario 7: Aislamiento de Tenants en Storefront

### Pasos

1. **Crea 2 tenants diferentes** (si no los tienes)
   - Tenant A: slug = "tienda-a"
   - Tenant B: slug = "tienda-b"
   - Cada uno con productos diferentes

2. **Visita storefront de Tenant A**
   - URL: `http://localhost:3000/tienda-a`
   - Verifica que solo se muestran productos de Tenant A

3. **Visita storefront de Tenant B**
   - URL: `http://localhost:3000/tienda-b`
   - Verifica que solo se muestran productos de Tenant B
   - **NO** deben aparecer productos de Tenant A

4. **Verifica que no hay fuga de datos**
   - Cada storefront debe mostrar SOLO sus propios productos
   - Categorías también deben estar aisladas por tenant

### ✅ Resultado esperado
- Cada storefront muestra solo sus propios productos
- No hay fuga de datos entre tenants
- Categorías están correctamente aisladas

---

## 🎯 Escenario 8: URL Inválida (404)

### Pasos

1. **Navega a un slug que no existe**
   - URL: `http://localhost:3000/este-slug-no-existe`

2. **Verificar página 404**
   - Deberías ver una página de error 404
   - O un mensaje claro: "Tienda no encontrada"
   - **NO** debe mostrar un error técnico o crash

3. **Verificar que no hay productos**
   - La página no debe mostrar productos de otros tenants
   - Debe estar vacía o mostrar mensaje de error amigable

### ✅ Resultado esperado
- URLs inválidas muestran 404 o mensaje de error claro
- No hay fuga de datos de otros tenants
- Experiencia de usuario es graceful (no crash)

---

## 🐛 Reportar Problemas

Si encuentras algún problema durante las pruebas:

1. **Describe el paso** donde ocurrió el error
2. **Captura de pantalla** del error (si es visual)
3. **Mensaje de error** exacto (si aparece)
4. **Consola del navegador** (F12 → Console) para errores técnicos
5. **URL exacta** donde ocurrió el problema

---

## ✅ Checklist Final

- [ ] Escenario 1: Generar QR desde dashboard ✅
- [ ] Escenario 2: Ver storefront público ✅
- [ ] Escenario 3: Filtrar por categoría ✅
- [ ] Escenario 4: Botón WhatsApp por producto ✅
- [ ] Escenario 5: Escanear QR con celular ✅
- [ ] Escenario 6: Compartir en redes sociales ✅
- [ ] Escenario 7: Aislamiento de tenants ✅
- [ ] Escenario 8: URL inválida (404) ✅

**Resultado final**: ___ / 8 escenarios pasados

---

**Notas adicionales**:
- Si algún escenario falla, anota el número y descripción del problema
- Los tests automáticos (Vitest) ya validaron la lógica de negocio
- Este test manual valida la experiencia de usuario completa
- Para el Escenario 5 (escanear QR), necesitas exponer localhost o desplegar temporalmente
