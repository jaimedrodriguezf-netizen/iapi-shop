# 🧪 Test E2E Manual - Product Catalog

**Fecha**: 2026-06-05  
**Módulo**: Product Catalog  
**URL Base**: http://localhost:3000

---

## 📋 Pre-requisitos

1. ✅ Servidor de desarrollo corriendo (`npm run dev`)
2. ✅ Base de datos con migraciones aplicadas
3. ✅ Usuario autenticado con rol de merchant
4. ✅ Tenant activo con plan Free (límite: 10 productos)

---

## 🎯 Escenario 1: Crear una Categoría

### Pasos

1. **Login** como merchant
   - Email: `vendedor@iapi.shop`
   - Password: (la que configuraste)
   - Deberías llegar a `/dashboard`

2. **Navegar a Productos**
   - Click en "Productos" en el sidebar
   - URL esperada: `/dashboard/products`
   - Deberías ver una tabla vacía o con productos existentes

3. **Crear nueva categoría**
   - Busca el botón "Nueva Categoría" o similar
   - Completa el formulario:
     - **Nombre**: "Electrónica"
     - **Descripción** (opcional): "Productos electrónicos"
   - Click en "Guardar"

4. **Verificar creación**
   - La categoría debería aparecer en la lista
   - Verifica que el nombre y descripción sean correctos

### ✅ Resultado esperado
- Categoría creada exitosamente
- Toast de confirmación: "Categoría creada"
- Categoría visible en el formulario de productos

---

## 🎯 Escenario 2: Crear un Producto

### Pasos

1. **Click en "Nuevo Producto"**
   - Debería abrirse un modal o página de formulario

2. **Completar formulario básico**
   - **Nombre**: "Auriculares Bluetooth"
   - **Precio**: 29.99
   - **Stock**: 50
   - **Categoría**: Selecciona "Electrónica" (la que creaste)

3. **Probar generación de descripción con IA**
   - Busca el botón "Generar con IA" o similar
   - Click en el botón
   - Espera 2-3 segundos
   - Debería generarse una descripción automática basada en el nombre

4. **Guardar producto**
   - Click en "Guardar" o "Crear Producto"
   - Espera confirmación

5. **Verificar creación**
   - El producto debería aparecer en la tabla
   - Verifica: nombre, precio, stock, categoría

### ✅ Resultado esperado
- Producto creado exitosamente
- Descripción generada por IA (si usaste el botón)
- Producto visible en la tabla con todos los datos correctos

---

## 🎯 Escenario 3: Editar un Producto

### Pasos

1. **Selecciona un producto existente**
   - Click en el botón "Editar" (ícono de lápiz) en la fila del producto

2. **Modificar datos**
   - Cambia el **precio** a 34.99
   - Cambia el **stock** a 100
   - Modifica la **descripción** (opcional)

3. **Guardar cambios**
   - Click en "Guardar" o "Actualizar"

4. **Verificar actualización**
   - Los nuevos valores deberían reflejarse en la tabla
   - Toast de confirmación: "Producto actualizado"

### ✅ Resultado esperado
- Producto actualizado correctamente
- Nuevos valores visibles en la tabla

---

## 🎯 Escenario 4: Eliminar un Producto

### Pasos

1. **Selecciona un producto**
   - Click en el botón "Eliminar" (ícono de papelera) en la fila del producto

2. **Confirmar eliminación**
   - Debería aparecer un diálogo de confirmación
   - Click en "Eliminar" o "Confirmar"

3. **Verificar eliminación**
   - El producto debería desaparecer de la tabla
   - Toast de confirmación: "Producto eliminado"

### ✅ Resultado esperado
- Producto eliminado correctamente
- Ya no aparece en la tabla

---

## 🎯 Escenario 5: Filtrar por Categoría

### Pasos

1. **Crea 2-3 productos más** en diferentes categorías
   - Ejemplo: "Camiseta" en categoría "Ropa"
   - Ejemplo: "Laptop" en categoría "Electrónica"

2. **Usa el filtro de categorías**
   - Busca un dropdown o selector de categorías
   - Selecciona "Electrónica"

3. **Verificar filtrado**
   - Solo deberían mostrarse productos de esa categoría
   - Cambia a "Ropa" y verifica que cambien los productos

4. **Limpiar filtro**
   - Selecciona "Todas" o similar
   - Deberían mostrarse todos los productos nuevamente

### ✅ Resultado esperado
- Filtrado funciona correctamente
- Solo se muestran productos de la categoría seleccionada

---

## 🎯 Escenario 6: Buscar Productos

### Pasos

1. **Usa el buscador**
   - Busca el campo de búsqueda en la parte superior de la tabla
   - Escribe: "auriculares"

2. **Verificar búsqueda**
   - Solo deberían mostrarse productos que coincidan con el término
   - Prueba con diferentes términos: "laptop", "camiseta"

3. **Limpiar búsqueda**
   - Borra el texto del buscador
   - Deberían mostrarse todos los productos nuevamente

### ✅ Resultado esperado
- Búsqueda funciona en tiempo real
- Filtra productos por nombre

---

## 🎯 Escenario 7: Límite de Plan (Solo si aplica)

### Pasos

1. **Verifica tu plan actual**
   - Si estás en plan Free, el límite es 10 productos
   - Intenta crear productos hasta llegar al límite

2. **Intenta crear un producto más**
   - Debería aparecer un mensaje de error o warning
   - Ejemplo: "Has alcanzado el límite de productos de tu plan"

3. **Verificar bloqueo**
   - No deberías poder crear más productos
   - Debería sugerir actualizar el plan

### ✅ Resultado esperado
- Sistema bloquea creación cuando se alcanza el límite
- Mensaje claro sobre el límite del plan

---

## 🎯 Escenario 8: Aislamiento de Tenant (Multi-tenant)

### Pasos

1. **Crea productos como merchant A**
   - Usa el usuario `vendedor@iapi.shop`
   - Crea 2-3 productos

2. **Login como merchant B**
   - Usa otro usuario (o crea uno nuevo)
   - Navega a `/dashboard/products`

3. **Verificar aislamiento**
   - **NO** deberías ver los productos del merchant A
   - Solo deberías ver tus propios productos (o tabla vacía)

### ✅ Resultado esperado
- Cada merchant solo ve sus propios productos
- No hay fuga de datos entre tenants

---

## 🐛 Reportar Problemas

Si encuentras algún problema durante las pruebas:

1. **Describe el paso** donde ocurrió el error
2. **Captura de pantalla** del error (si es visual)
3. **Mensaje de error** exacto (si aparece)
4. **Consola del navegador** (F12 → Console) para errores técnicos

---

## ✅ Checklist Final

- [ ] Escenario 1: Crear categoría ✅
- [ ] Escenario 2: Crear producto ✅
- [ ] Escenario 3: Editar producto ✅
- [ ] Escenario 4: Eliminar producto ✅
- [ ] Escenario 5: Filtrar por categoría ✅
- [ ] Escenario 6: Buscar productos ✅
- [ ] Escenario 7: Límite de plan ✅
- [ ] Escenario 8: Aislamiento de tenant ✅

**Resultado final**: ___ / 8 escenarios pasados

---

**Notas adicionales**:
- Si algún escenario falla, anota el número y descripción del problema
- Los tests automáticos (Vitest) ya validaron la lógica de negocio
- Este test manual valida la experiencia de usuario completa
