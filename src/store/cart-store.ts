import { create } from 'zustand'
import type { CartItem, Product, ProductVariant } from '../types'

const STORAGE_KEY = 'anahi-nails-diamond-cart'

interface CartState {
  items: CartItem[]
  hydrated: boolean
  hydrate: () => void
  addItem: (product: Product, quantity?: number, selectedVariant?: ProductVariant | null) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  clearCart: () => void
}

function getItemKey(productId: string, variantId?: string | null) {
  return `${productId}::${variantId || 'base'}`
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
  addItem: (product, quantity = 1, selectedVariant = null) => {
    const current = get().items
    const itemKey = getItemKey(product.id, selectedVariant?.id)
    const existing = current.find((item) => getItemKey(item.product.id, item.selectedVariant?.id) === itemKey)
    const limit = selectedVariant?.stock || product.stock || 99
    const items = existing
      ? current.map((item) =>
          getItemKey(item.product.id, item.selectedVariant?.id) === itemKey
            ? { ...item, quantity: Math.min(item.quantity + quantity, limit) }
            : item,
        )
      : [...current, { product, quantity: Math.min(quantity, limit), selectedVariant }]
    persist(items)
    set({ items })
  },
  removeItem: (productId, variantId = null) => {
    const itemKey = getItemKey(productId, variantId)
    const items = get().items.filter((item) => getItemKey(item.product.id, item.selectedVariant?.id) !== itemKey)
    persist(items)
    set({ items })
  },
  updateQuantity: (productId, quantity, variantId = null) => {
    const itemKey = getItemKey(productId, variantId)
    const items = get().items
      .map((item) =>
        getItemKey(item.product.id, item.selectedVariant?.id) === itemKey
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.selectedVariant?.stock || item.product.stock || 99)),
            }
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
