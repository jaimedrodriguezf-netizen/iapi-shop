import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  tenant_id: string
}

// Estructura de datos por sucursal para garantizar aislamiento total
interface CartState {
  carts: Record<string, CartItem[]> // Key: tenant_id
  addItem: (tenantId: string, product: Omit<CartItem, 'quantity' | 'tenant_id'>) => void
  removeItem: (tenantId: string, productId: string) => void
  updateQuantity: (tenantId: string, productId: string, quantity: number) => void
  clearCart: (tenantId: string) => void
  getTenantItems: (tenantId: string) => CartItem[]
  getTenantTotal: (tenantId: string) => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      
      addItem: (tenantId, product) => {
        const currentCarts = get().carts
        const tenantItems = currentCarts[tenantId] || []
        const existingItem = tenantItems.find((item) => item.id === product.id)

        let newTenantItems
        if (existingItem) {
          newTenantItems = tenantItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          newTenantItems = [...tenantItems, { ...product, quantity: 1, tenant_id: tenantId }]
        }

        set({
          carts: { ...currentCarts, [tenantId]: newTenantItems }
        })
      },

      removeItem: (tenantId, productId) => {
        const currentCarts = get().carts
        const tenantItems = currentCarts[tenantId] || []
        
        set({
          carts: {
            ...currentCarts,
            [tenantId]: tenantItems.filter((item) => item.id !== productId)
          }
        })
      },

      updateQuantity: (tenantId, productId, quantity) => {
        const currentCarts = get().carts
        const tenantItems = currentCarts[tenantId] || []

        if (quantity <= 0) {
          get().removeItem(tenantId, productId)
          return
        }

        set({
          carts: {
            ...currentCarts,
            [tenantId]: tenantItems.map((item) =>
              item.id === productId ? { ...item, quantity } : item
            )
          }
        })
      },

      clearCart: (tenantId) => {
        const currentCarts = get().carts
        set({
          carts: { ...currentCarts, [tenantId]: [] }
        })
      },

      getTenantItems: (tenantId) => {
        return get().carts[tenantId] || []
      },

      getTenantTotal: (tenantId) => {
        const items = get().carts[tenantId] || []
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'iapi-cart-storage-v4', // Cambiamos versión para evitar conflictos de estructura
      storage: createJSONStorage(() => localStorage),
    }
  )
)
