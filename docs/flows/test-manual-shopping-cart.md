# 🧪 Test E2E Manual - Shopping Cart

**Fecha**: 2026-06-05  
**Módulo**: Shopping Cart  
**URL Base**: http://localhost:3000

---

## 📋 Pre-requisitos

1. ✅ Servidor de desarrollo corriendo (`npm run dev`)
2. ✅ Base de datos con migraciones aplicadas
3. ✅ Al menos 1 tenant con productos creados (mínimo 3 productos)
4. ✅ Tenant debe tener número de WhatsApp configurado
5. ✅ Storefront público accesible (`/[slug]`)

---

## 🎯 Escenario 1: Agregar Producto al Carrito

### Pasos

1. **Navega al storefront público**
   - URL: `http://localhost:3000/[tu-slug]`
   - **NO necesitas estar autenticado** (es público)

2. **Busca un producto**
   - Deberías ver tarjetas de productos con imagen, nombre, precio
   - Cada producto debe tener un botón "Agregar al carrito" o ícono de carrito

3. **Click en "Agregar al carrito"**
   - Click en el botón del primer producto
   - Deberías ver:
     - Toast de confirmación: "Producto agregado al carrito"
     - El botón puede cambiar a "Agregar otro" o mostrar un contador

4. **Verifica el badge del carrito**
   - Busca el ícono flotante del carrito (esquina inferior derecha o superior)
   - Debería mostrar un badge con el número "1"
   - El badge indica cuántos items hay en el carrito

### ✅ Resultado esperado
- Producto agregado exitosamente
- Toast de confirmación visible
- Badge del carrito muestra "1"

---

## 🎯 Escenario 2: Abrir Drawer del Carrito

### Pasos

1. **Click en el ícono del carrito**
   - Click en el ícono flotante del carrito
   - Debería abrirse un drawer/panel lateral

2. **Verifica el contenido del drawer**
   - Deberías ver:
     - **Lista de items**: El producto que agregaste
     - **Cantidad**: "1" o un selector de cantidad
     - **Precio unitario**: Precio del producto
     - **Subtotal**: Precio × cantidad
     - **Total**: Suma de todos los items
     - **Botón "Finalizar pedido"** o "Enviar por WhatsApp"

3. **Verifica que el drawer se puede cerrar**
   - Click fuera del drawer o en el botón de cerrar (X)
   - El drawer debe cerrarse suavemente

### ✅ Resultado esperado
- Drawer se abre correctamente
- Muestra el producto agregado con todos los detalles
- Total calculado correctamente
- Drawer se puede cerrar fácilmente

---

## 🎯 Escenario 3: Modificar Cantidad en el Carrito

### Pasos

1. **Abre el drawer del carrito**
   - Click en el ícono del carrito

2. **Aumenta la cantidad**
   - Busca el botón "+" o "Agregar más"
   - Click 2 veces para aumentar la cantidad a 3
   - Verifica que:
     - La cantidad se actualice a "3"
     - El subtotal se actualice (precio × 3)
     - El total se actualice
     - El badge del carrito muestre "3"

3. **Disminuye la cantidad**
   - Busca el botón "-" o "Quitar uno"
   - Click 1 vez para disminuir la cantidad a 2
   - Verifica que:
     - La cantidad se actualice a "2"
     - El subtotal se actualice (precio × 2)
     - El total se actualice
     - El badge del carrito muestre "2"

### ✅ Resultado esperado
- Cantidad se puede aumentar y disminuir
- Subtotal y total se actualizan en tiempo real
- Badge del carrito refleja la cantidad total

---

## 🎯 Escenario 4: Agregar Múltiples Productos

### Pasos

1. **Cierra el drawer** (si está abierto)

2. **Agrega un segundo producto diferente**
   - Click en "Agregar al carrito" de otro producto
   - Verifica que el badge del carrito muestre "3" (2 del primero + 1 del segundo)

3. **Agrega un tercer producto diferente**
   - Click en "Agregar al carrito" de otro producto
   - Verifica que el badge del carrito muestre "4" (2 + 1 + 1)

4. **Abre el drawer del carrito**
   - Deberías ver 3 items diferentes en la lista
   - Cada item con su nombre, cantidad, precio y subtotal
   - El total debe ser la suma de todos los subtotales

### ✅ Resultado esperado
- Múltiples productos se pueden agregar al carrito
- Badge muestra la cantidad total de items
- Drawer lista todos los productos correctamente
- Total es la suma de todos los subtotales

---

## 🎯 Escenario 5: Eliminar Producto del Carrito

### Pasos

1. **Abre el drawer del carrito**
   - Deberías ver los 3 productos agregados

2. **Elimina un producto**
   - Busca el botón "Eliminar" o ícono de papelera en uno de los items
   - Click en el botón
   - El producto debe desaparecer de la lista

3. **Verifica actualización**
   - El total debe actualizarse (restar el subtotal del producto eliminado)
   - El badge del carrito debe actualizarse
   - Solo deben quedar 2 productos en la lista

4. **Reduce cantidad a cero** (alternativa)
   - En otro producto, click en "-" hasta que la cantidad sea 0
   - El producto debe eliminarse automáticamente del carrito
   - Solo debe quedar 1 producto

### ✅ Resultado esperado
- Productos se pueden eliminar del carrito
- Total y badge se actualizan correctamente
- Reducir cantidad a 0 elimina el producto automáticamente

---

## 🎯 Escenario 6: Persistencia del Carrito (Recarga de Página)

### Pasos

1. **Agrega 2-3 productos al carrito**
   - Desde el storefront público
   - Verifica que el badge muestre la cantidad correcta

2. **Recarga la página**
   - Presiona F5 o Ctrl+R
   - O cierra y vuelve a abrir el navegador

3. **Verifica que el carrito persiste**
   - El badge del carrito debe mostrar la misma cantidad
   - Abre el drawer del carrito
   - Los productos deben seguir ahí
   - Las cantidades deben ser las mismas
   - El total debe ser el mismo

### ✅ Resultado esperado
- Carrito persiste después de recargar la página
- Todos los productos y cantidades se mantienen
- Usa localStorage para persistencia

---

## 🎯 Escenario 7: Aislamiento de Carrito por Tenant

### Pasos

1. **Agrega productos al carrito en Tenant A**
   - URL: `http://localhost:3000/[slug-tenant-a]`
   - Agrega 2-3 productos
   - Verifica que el badge muestre la cantidad correcta

2. **Navega al storefront de Tenant B**
   - URL: `http://localhost:3000/[slug-tenant-b]`
   - **Importante**: Es un tenant diferente

3. **Verifica que el carrito está vacío**
   - El badge del carrito debe mostrar "0" o no estar visible
   - Abre el drawer del carrito
   - Debe estar vacío o mostrar "Tu carrito está vacío"
   - **NO** debe mostrar los productos de Tenant A

4. **Agrega productos en Tenant B**
   - Agrega 1-2 productos de Tenant B
   - Verifica que el badge muestre solo los productos de Tenant B

5. **Vuelve a Tenant A**
   - URL: `http://localhost:3000/[slug-tenant-a]`
   - Verifica que el carrito de Tenant A sigue intacto
   - Debe mostrar los productos que agregaste originalmente

### ✅ Resultado esperado
- Cada tenant tiene su propio carrito independiente
- No hay fuga de productos entre tenants
- Carrito está correctamente aislado por tenant_id

---

## 🎯 Escenario 8: Finalizar Pedido por WhatsApp

### Pasos

1. **Agrega 2-3 productos al carrito**
   - Desde el storefront público
   - Abre el drawer del carrito

2. **Verifica el total**
   - El total debe ser correcto
   - Verifica que todos los productos estén listados

3. **Click en "Finalizar pedido" o "Enviar por WhatsApp"**
   - Click en el botón de checkout
   - Debería abrirse WhatsApp Web o la app de WhatsApp

4. **Verifica el mensaje pre-llenado**
   - El mensaje debe incluir:
     - **Saludo**: "Hola! Me gustaría hacer un pedido:"
     - **Lista de productos**:
       - Nombre del producto × cantidad - $subtotal
       - Ejemplo: "Auriculares Bluetooth × 2 - $59.98"
     - **Total**: "Total: $89.97"
     - **Nombre de la tienda**: "Tienda IAPI"
   - El mensaje debe estar bien formateado y legible

5. **Verifica el número de teléfono**
   - El mensaje debe enviarse al número de WhatsApp del tenant
   - Verifica que sea el número correcto (el que configuraste en onboarding)

6. **Envía el mensaje** (opcional)
   - Si quieres, envía el mensaje para probar el flujo completo
   - Deberías recibir el mensaje en el WhatsApp del merchant

### ✅ Resultado esperado
- Botón de checkout abre WhatsApp
- Mensaje pre-llenado con lista de productos y total
- Mensaje bien formateado y legible
- Número de teléfono es el correcto del tenant

---

## 🎯 Escenario 9: Carrito Vacío

### Pasos

1. **Vacía el carrito** (si tiene productos)
   - Elimina todos los productos uno por uno
   - O reduce todas las cantidades a 0

2. **Verifica estado vacío**
   - El badge del carrito debe desaparecer o mostrar "0"
   - Abre el drawer del carrito
   - Debe mostrar un mensaje: "Tu carrito está vacío" o similar
   - El botón "Finalizar pedido" debe estar deshabilitado o no visible

3. **Intenta hacer checkout**
   - Si el botón está visible, intenta hacer click
   - No debe pasar nada o debe mostrar un mensaje de error

### ✅ Resultado esperado
- Carrito vacío muestra mensaje apropiado
- Botón de checkout deshabilitado o no visible
- No se puede hacer checkout con carrito vacío

---

## 🎯 Escenario 10: Truncamiento de Mensaje Largo

### Pasos

1. **Agrega muchos productos al carrito**
   - Agrega 10-15 productos diferentes (si tienes tantos)
   - O agrega el mismo producto con cantidad alta (ej: 20)

2. **Abre el drawer del carrito**
   - Verifica que todos los productos estén listados

3. **Click en "Finalizar pedido"**
   - Debería abrirse WhatsApp

4. **Verifica el mensaje**
   - Si el mensaje es muy largo, debe estar truncado
   - Debe incluir los primeros productos y el total
   - Puede incluir un mensaje como: "... y X productos más"
   - El mensaje no debe exceder el límite de WhatsApp (~2000 caracteres)

### ✅ Resultado esperado
- Mensajes largos se truncan apropiadamente
- WhatsApp acepta el mensaje (no hay error)
- El mensaje incluye la información más importante

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

- [ ] Escenario 1: Agregar producto al carrito ✅
- [ ] Escenario 2: Abrir drawer del carrito ✅
- [ ] Escenario 3: Modificar cantidad ✅
- [ ] Escenario 4: Agregar múltiples productos ✅
- [ ] Escenario 5: Eliminar producto del carrito ✅
- [ ] Escenario 6: Persistencia del carrito (recarga) ✅
- [ ] Escenario 7: Aislamiento de carrito por tenant ✅
- [ ] Escenario 8: Finalizar pedido por WhatsApp ✅
- [ ] Escenario 9: Carrito vacío ✅
- [ ] Escenario 10: Truncamiento de mensaje largo ✅

**Resultado final**: ___ / 10 escenarios pasados

---

**Notas adicionales**:
- Si algún escenario falla, anota el número y descripción del problema
- Los tests automáticos (Vitest) ya validaron la lógica de negocio (146 tests)
- Este test manual valida la experiencia de usuario completa
- El Escenario 7 (aislamiento) es crítico para multi-tenancy
- El Escenario 8 (WhatsApp) es la funcionalidad principal del módulo
