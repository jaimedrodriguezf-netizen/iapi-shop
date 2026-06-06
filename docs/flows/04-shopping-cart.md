# Shopping Cart

**Tareas**: 10  
**Complejidad**: Media  
**Prioridad**: 4

## Objetivo

Permitir a clientes construir pedidos multi-item y enviarlos por WhatsApp.

## Flujo principal

```
Cliente → Storefront público /[slug]
       ↓
Ve productos → Click "Agregar al carrito"
       ↓
Estado del carrito (zustand + localStorage):
  ├─ Scoped por tenant_id
  ├─ items: [{productId, name, price, quantity}]
  └─ total: calculado automáticamente
       ↓
Botón flotante "Ver carrito" → Drawer
  ├─ Lista de items con +/- cantidad
  ├─ Total del pedido
  └─ Botón "Finalizar pedido"
       ↓
Genera mensaje WhatsApp:
  "Hola! Quiero pedir:
   - 2x Producto A ($20)
   - 1x Producto B ($15)
   Total: $55"
       ↓
Abre wa.me/[phone]?text=[mensaje]
```

## Archivos clave

- `src/lib/store/cart-store.ts` (nuevo)
- `src/components/storefront/cart-drawer.tsx` (nuevo)
- `src/components/storefront/product-card.tsx` (modificar)
- `src/lib/whatsapp.ts` (nuevo)

## Consideraciones

- El carrito debe estar scoped por tenant_id para evitar mezclar productos de diferentes shops
- Persistir en localStorage para sobrevivir recargas de página
- Truncar mensajes muy largos para WhatsApp (límite ~2000 caracteres)
- Validar que el producto siga existiendo antes de enviar el pedido
