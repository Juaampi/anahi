export type ProductBadge = 'new' | 'sale' | 'best-seller'
export type StoreSite = 'anahinails' | 'wildspirit'

export interface ProductVariant {
  id: string
  name?: string
  color: string
  imageUrl?: string
  stock: number
}

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  imageUrl?: string
  site: StoreSite
}

export interface Product {
  id: string
  slug: string
  sku: string
  name: string
  description: string
  shortDescription: string
  price: number
  compareAtPrice?: number | null
  stock: number
  featured: boolean
  badges: ProductBadge[]
  imageUrls: string[]
  categoryId: string
  categoryName: string
  site: StoreSite
  subcategory?: string
  variants: ProductVariant[]
  createdAt?: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedVariant?: ProductVariant | null
}

export interface OrderItemInput {
  productId: string
  productName?: string
  variantId?: string
  variantLabel?: string
  quantity: number
  unitPrice: number
}

export interface CheckoutInput {
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  notes?: string
  sendWhatsAppSummary?: boolean
  couponCode?: string
  shippingMethod?: 'delivery' | 'branch'
  shippingCost?: number
  shippingLabel?: string
  items: OrderItemInput[]
}

export interface Order extends CheckoutInput {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'packing' | 'shipped' | 'cancelled'
  subtotal: number
  discountAmount: number
  shippingMethod: 'delivery' | 'branch'
  shippingCost: number
  shippingLabel?: string
  total: number
  couponId?: string | null
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
}

export interface StorefrontPayload {
  categories: Category[]
  featuredProducts: Product[]
  bestSellers: Product[]
  newArrivals: Product[]
}

export interface CatalogFilters {
  category?: string
  q?: string
  featured?: boolean
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest'
  minPrice?: number
  maxPrice?: number
}

export type ThemeMode = 'light' | 'dark'

export type CouponType = 'percentage' | 'fixed'

export interface DiscountCoupon {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  minSubtotal?: number | null
  active: boolean
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
  usageCount: number
  createdAt?: string
}

export interface CouponValidation {
  valid: boolean
  message?: string
  coupon?: DiscountCoupon
  subtotal: number
  discountAmount: number
  total: number
}

export interface StoreSettings {
  id: string
  standardShippingLabel: string
  standardShippingCost: number
  branchShippingEnabled: boolean
  branchShippingLabel: string
  branchShippingCost: number
  freeShippingEnabled: boolean
  freeShippingThreshold: number
}
