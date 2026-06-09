import { create } from 'zustand'
import type { CartItem, Product } from '../types'

const STORAGE_KEY = 'anahi-nails-diamond-cart'

interface CartState {
  items: CartItem[]
  hydrated: boolean
  hydrate: () => void
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

function persist(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const items = raw ? (JSON.parse(raw) as CartItem[]) : []
      set({ items, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
  addItem: (product, quantity = 1) => {
    const current = get().items
    const existing = current.find((item) => item.product.id === product.id)
    const items = existing
      ? current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99) }
            : item,
        )
      : [...current, { product, quantity }]
    persist(items)
    set({ items })
  },
  removeItem: (productId) => {
    const items = get().items.filter((item) => item.product.id !== productId)
    persist(items)
    set({ items })
  },
  updateQuantity: (productId, quantity) => {
    const items = get().items
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock || 99)) }
          : item,
      )
      .filter((item) => item.quantity > 0)
    persist(items)
    set({ items })
  },
  clearCart: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ items: [] })
  },
}))
