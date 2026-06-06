# 📋 Flujos de Implementación - IAPI Shop

Este directorio contiene la documentación de los 5 flujos principales del sistema, ordenados por prioridad de implementación.

## 🎯 Opciones de Implementación

Cuando tengas tiempo, podés implementar cualquiera de estos flujos. Están ordenados por prioridad recomendada:

### 1️⃣ **Merchant Onboarding** (8 tareas) - Prioridad Alta
Crear el flujo de registro de nuevos merchants y creación de su primer shop.

**¿Por qué primero?** Es la base para todo lo demás. Sin merchants no hay productos ni storefronts.

[Ver flujo completo →](./02-merchant-onboarding.md)

---

### 2️⃣ **Product Catalog** (11 tareas) - Prioridad Alta
Permitir a merchants gestionar su catálogo de productos con categorías y generación de descripciones con IA.

**¿Por qué segundo?** Es la funcionalidad core del sistema. Los merchants necesitan productos para vender.

[Ver flujo completo →](./03-product-catalog.md)

---

### 3️⃣ **Storefront QR** (10 tareas) - Prioridad Media
Crear la cara pública del storefront con generación de códigos QR para compartir.

**¿Por qué tercero?** Una vez que hay productos, los merchants necesitan una forma de mostrarlos a sus clientes.

[Ver flujo completo →](./05-storefront-qr.md)

---

### 4️⃣ **Shopping Cart** (10 tareas) - Prioridad Media
Permitir a clientes construir pedidos multi-item y enviarlos por WhatsApp.

**¿Por qué cuarto?** Mejora la conversión del storefront público, pero no es crítico para el MVP.

[Ver flujo completo →](./04-shopping-cart.md)

---

### 5️⃣ **Branding Customization** (13 tareas) - Prioridad Baja
Permitir a merchants personalizar colores, logo y apariencia de su storefront.

**¿Por qué último?** Es una funcionalidad "nice to have" que no afecta la funcionalidad core.

[Ver flujo completo →](./01-branding-customization.md)

---

## 📊 Resumen de Tareas

| Flujo | Tareas | Complejidad | Estado SDD |
|-------|--------|-------------|------------|
| Merchant Onboarding | 8 | Baja | ✅ Listo para apply |
| Product Catalog | 11 | Alta | ✅ Listo para apply |
| Storefront QR | 10 | Media | ✅ Listo para apply |
| Shopping Cart | 10 | Media | ✅ Listo para apply |
| Branding Customization | 13 | Media | ✅ Listo para apply |

**Total**: 52 tareas

---

## 🚀 Cómo Implementar

Cuando estés listo para implementar un flujo, simplemente decime:

```
"Implementá el flujo de [nombre del flujo]"
```

Y yo me encargo de:
1. Ejecutar `/sdd-apply` para implementar las tareas
2. Ejecutar `/sdd-verify` para validar la implementación
3. Ejecutar `/sdd-archive` para archivar el cambio completado

---

## 📝 Notas

- Todos los flujos tienen specs, design y tasks completos (SDD completo)
- Podés implementar en cualquier orden, pero el orden recomendado optimiza dependencias
- Cada flujo es independiente y puede implementarse por separado
- Los archivos de este directorio son solo para referencia, la fuente de verdad está en `openspec/changes/`
