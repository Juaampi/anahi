import type {
  AdminUser,
  Category,
  CheckoutInput,
  CouponValidation,
  DiscountCoupon,
  Order,
  Product,
  StoreSettings,
  StoreSite,
  StorefrontPayload,
} from '../types'
import { fallbackCategories, fallbackProducts, fallbackSettings, fallbackStorefront } from './fallback-data'

const API_BASE = '/.netlify/functions/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!response.ok) {
    const rawMessage = await response.text()
    try {
      const parsed = JSON.parse(rawMessage) as { message?: string }
      throw new Error(parsed.message || 'No se pudo completar la solicitud.')
    } catch {
      throw new Error(rawMessage || 'No se pudo completar la solicitud.')
    }
  }

  return response.json() as Promise<T>
}

export const api = {
  storefront: async (site: StoreSite) => {
    try {
      return await request<StorefrontPayload>(`/storefront?site=${site}`)
    } catch {
      return {
        categories: fallbackStorefront.categories.filter((item) => item.site === site),
        featuredProducts: fallbackProducts.filter((item) => item.site === site && item.featured).slice(0, 4),
        bestSellers: fallbackProducts.filter((item) => item.site === site && item.badges.includes('best-seller')).slice(0, 4),
        newArrivals: fallbackProducts.filter((item) => item.site === site && item.badges.includes('new')).slice(0, 4),
      }
    }
  },
  products: async (filters: URLSearchParams) => {
    try {
      return await request<Product[]>(`/products?${filters.toString()}`)
    } catch {
      let items = [...fallbackProducts]
      const category = filters.get('category')
      const q = filters.get('q')?.toLowerCase()
      const brand = filters.get('brand')?.toLowerCase()
      const featured = filters.get('featured')
      const minPrice = Number(filters.get('minPrice') || 0)
      const maxPrice = Number(filters.get('maxPrice') || 0)
      const sort = filters.get('sort') || 'featured'

      if (category) {
        items = items.filter(
          (item) =>
            item.categoryId === category ||
            item.categoryName.toLowerCase().includes(category.toLowerCase()) ||
            item.slug.includes(category),
        )
      }
      if (q) {
        items = items.filter((item) => item.name.toLowerCase().includes(q) || (item.brand || '').toLowerCase().includes(q))
      }
      if (brand) {
        items = items.filter((item) => (item.brand || '').toLowerCase() === brand)
      }
      if (featured === 'true') {
        items = items.filter((item) => item.featured)
      }
      if (minPrice) {
        items = items.filter((item) => item.price >= minPrice)
      }
      if (maxPrice) {
        items = items.filter((item) => item.price <= maxPrice)
      }

      if (sort === 'price-asc') return items.sort((a, b) => a.price - b.price)
      if (sort === 'price-desc') return items.sort((a, b) => b.price - a.price)
      if (sort === 'newest') return items.reverse()
      return items.sort((a, b) => Number(b.featured) - Number(a.featured))
    }
  },
  productBySlug: async (slug: string) => {
    try {
      return await request<Product>(`/products/${slug}`)
    } catch {
      const found = fallbackProducts.find((item) => item.slug === slug)
      if (!found) {
        throw new Error('Producto no encontrado.')
      }
      return found
    }
  },
  categories: async (site?: StoreSite) => {
    try {
      return await request<Category[]>(site ? `/categories?site=${site}` : '/categories')
    } catch {
      return site ? fallbackCategories.filter((item) => item.site === site) : fallbackCategories
    }
  },
  settings: async () => {
    try {
      return await request<StoreSettings>('/settings')
    } catch {
      return fallbackSettings
    }
  },
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  adminProducts: (token: string) =>
    request<Product[]>('/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  saveProduct: (token: string, product: Partial<Product>) =>
    request<Product>('/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(product),
    }),
  updateProduct: (token: string, id: string, product: Partial<Product>) =>
    request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(product),
    }),
  deleteProduct: (token: string, id: string) =>
    request<{ success: true }>(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminCategories: (token: string) =>
    request<Category[]>('/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  saveCategory: (token: string, category: Partial<Category>) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(category),
    }),
  updateCategory: (token: string, id: string, category: Partial<Category>) =>
    request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(category),
    }),
  deleteCategory: (token: string, id: string) =>
    request<{ success: true }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminOrders: (token: string) =>
    request<Order[]>('/admin/orders', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateOrderStatus: (token: string, id: string, status: string) =>
    request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
  adminCoupons: (token: string) =>
    request<DiscountCoupon[]>('/admin/coupons', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminSettings: (token: string) =>
    request<StoreSettings>('/admin/settings', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  saveSettings: (token: string, settings: Partial<StoreSettings>) =>
    request<StoreSettings>('/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    }),
  saveCoupon: (token: string, coupon: Partial<DiscountCoupon>) =>
    request<DiscountCoupon>('/admin/coupons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(coupon),
    }),
  updateCoupon: (token: string, id: string, coupon: Partial<DiscountCoupon>) =>
    request<DiscountCoupon>(`/admin/coupons/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(coupon),
    }),
  deleteCoupon: (token: string, id: string) =>
    request<{ success: true }>(`/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  validateCoupon: (couponCode: string, subtotal: number) =>
    request<CouponValidation>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ couponCode, subtotal }),
    }),
  createOrder: (payload: CheckoutInput) =>
    request<{ order: Order; whatsappUrl?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createPreference: (payload: CheckoutInput) =>
    request<{ preferenceId: string; initPoint?: string; sandboxInitPoint?: string }>(
      '/checkout/create-preference',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  signCloudinaryUpload: (token: string, folder: string) =>
    request<{ timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string }>(
      '/cloudinary/signature',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ folder }),
      },
    ),
}
