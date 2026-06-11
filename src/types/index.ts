export type ProductBadge = 'new' | 'sale' | 'best-seller'

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  imageUrl?: string
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
  createdAt?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderItemInput {
  productId: string
  productName?: string
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
  items: OrderItemInput[]
}

export interface Order extends CheckoutInput {
  id: string
  orderNumber: string
  status: 'pending' | 'paid' | 'packing' | 'shipped' | 'cancelled'
  subtotal: number
  discountAmount: number
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
