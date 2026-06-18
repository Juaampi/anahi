import type { Handler } from '@netlify/functions'
import { v2 as cloudinary } from 'cloudinary'
import crypto from 'node:crypto'
import MercadoPagoConfig, { Preference } from 'mercadopago'
import { ensureDatabase, getMemoryAdmin, getMemoryState } from './_lib/db'
import { signAdminToken, verifyAdminToken, verifyPassword } from './_lib/auth'

type ProductInput = {
  id?: string
  slug?: string
  sku?: string
  name?: string
  description?: string
  shortDescription?: string
  price?: number
  compareAtPrice?: number | null
  stock?: number
  featured?: boolean
  badges?: string[]
  imageUrls?: string[]
  categoryId?: string
  site?: string
  subcategory?: string
  variants?: Array<{ id?: string; name?: string; color?: string; imageUrl?: string; stock?: number }>
}

type CategoryInput = {
  slug: string
  name: string
  description: string
  imageUrl?: string
  site?: string
}

type CouponInput = {
  id?: string
  code?: string
  description?: string
  type?: 'percentage' | 'fixed'
  value?: number
  minSubtotal?: number | null
  active?: boolean
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
}

type DataRow = Record<string, unknown>
type OrderPayload = {
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
  items: Array<{ productId: string; productName?: string; quantity: number; unitPrice: number }>
}

const headers = {
  'Content-Type': 'application/json',
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers, body: JSON.stringify(body) }
}

function parseBody<T>(raw?: string | null): T {
  return raw ? (JSON.parse(raw) as T) : ({} as T)
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function createOrderNumber() {
  return `AND-${Date.now().toString().slice(-8)}`
}

function normalizeCouponCode(code?: string) {
  return (code || '').trim().toUpperCase()
}

function roundMoney(value: number) {
  return Math.max(0, Math.round(value * 100) / 100)
}

function getToken(event: Parameters<Handler>[0]) {
  const auth = event.headers.authorization || event.headers.Authorization
  if (!auth) return ''
  return auth.replace('Bearer ', '')
}

function requireAdmin(event: Parameters<Handler>[0]) {
  const token = getToken(event)
  if (!token) throw new Error('Unauthorized')
  return verifyAdminToken(token)
}

function normalizeProduct(row: DataRow) {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description ?? row.shortDescription,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price ?? row.compareAtPrice),
    stock: Number(row.stock),
    featured: Boolean(row.featured),
    badges: Array.isArray(row.badges) ? row.badges : JSON.parse(row.badges || '[]'),
    imageUrls: Array.isArray(row.image_urls)
      ? row.image_urls
      : Array.isArray(row.imageUrls)
        ? row.imageUrls
        : JSON.parse(row.image_urls || '[]'),
    variants: Array.isArray(row.variants)
      ? row.variants
      : JSON.parse(String(row.variants || '[]')),
    categoryId: row.category_id ?? row.categoryId,
    categoryName: row.category_name ?? row.categoryName,
    site: row.site ?? 'anahinails',
    subcategory: row.subcategory ?? null,
    createdAt: row.created_at ?? row.createdAt,
  }
}

function normalizeCategory(row: DataRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    site: row.site ?? 'anahinails',
  }
}

function normalizeCoupon(row: DataRow) {
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? '',
    type: row.type,
    value: Number(row.value),
    minSubtotal: row.min_subtotal === null ? null : Number(row.min_subtotal ?? row.minSubtotal ?? 0),
    active: Boolean(row.active),
    startsAt: (row.starts_at ?? row.startsAt ?? null) as string | null,
    endsAt: (row.ends_at ?? row.endsAt ?? null) as string | null,
    usageLimit: row.usage_limit === null ? null : Number(row.usage_limit ?? row.usageLimit ?? 0),
    usageCount: Number(row.usage_count ?? row.usageCount ?? 0),
    createdAt: row.created_at ?? row.createdAt,
  }
}

function sortProducts(items: Array<Record<string, unknown> & { price: number; featured: boolean }>, sort: string) {
  const clone = [...items]
  if (sort === 'price-asc') return clone.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return clone.sort((a, b) => b.price - a.price)
  if (sort === 'newest') return clone.reverse()
  return clone.sort((a, b) => Number(b.featured) - Number(a.featured))
}

async function listCategories(site?: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const items = site ? getMemoryState().categories.filter((item) => item.site === site) : getMemoryState().categories
    return items.map(normalizeCategory)
  }
  if (site) {
    const rows = await sql.query('SELECT id, slug, name, description, image_url, site FROM categories WHERE site = $1 ORDER BY name ASC', [site])
    return rows.map(normalizeCategory)
  }
  const rows = await sql.query('SELECT id, slug, name, description, image_url, site FROM categories ORDER BY name ASC')
  return rows.map(normalizeCategory)
}

async function listCoupons() {
  const sql = await ensureDatabase()
  if (!sql) return getMemoryState().coupons.map(normalizeCoupon)
  const rows = await sql.query('SELECT * FROM discount_coupons ORDER BY created_at DESC, code ASC')
  return rows.map(normalizeCoupon)
}

async function listProducts(searchParams: URLSearchParams) {
  const sql = await ensureDatabase()
  const category = searchParams.get('category')
  const subcategory = searchParams.get('subcategory')
  const site = searchParams.get('site')
  const q = searchParams.get('q')?.toLowerCase()
  const featured = searchParams.get('featured')
  const minPrice = Number(searchParams.get('minPrice') || 0)
  const maxPrice = Number(searchParams.get('maxPrice') || 0)
  const sort = searchParams.get('sort') || 'featured'

  if (!sql) {
    let items = [...getMemoryState().products]
    if (site) items = items.filter((item) => item.site === site)
    if (category) items = items.filter((item) => item.categoryName.toLowerCase().includes(category.toLowerCase()) || item.categoryId === category || item.slug.includes(category))
    if (subcategory) items = items.filter((item) => (item.subcategory || '').toLowerCase() === subcategory.toLowerCase())
    if (q) items = items.filter((item) => item.name.toLowerCase().includes(q))
    if (featured === 'true') items = items.filter((item) => item.featured)
    if (minPrice) items = items.filter((item) => item.price >= minPrice)
    if (maxPrice) items = items.filter((item) => item.price <= maxPrice)
    return sortProducts(items, sort)
  }

  let query = `
    SELECT p.*, c.name AS category_name
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    WHERE 1=1
  `
  const params: unknown[] = []
  if (category) {
    params.push(category)
    query += ` AND (c.slug = $${params.length} OR p.category_id = $${params.length})`
  }
  if (subcategory) {
    params.push(subcategory)
    query += ` AND LOWER(COALESCE(p.subcategory, '')) = LOWER($${params.length})`
  }
  if (site) {
    params.push(site)
    query += ` AND p.site = $${params.length}`
  }
  if (q) {
    params.push(`%${q}%`)
    query += ` AND LOWER(p.name) LIKE $${params.length}`
  }
  if (featured === 'true') query += ' AND p.featured = TRUE'
  if (minPrice) {
    params.push(minPrice)
    query += ` AND p.price >= $${params.length}`
  }
  if (maxPrice) {
    params.push(maxPrice)
    query += ` AND p.price <= $${params.length}`
  }

  query +=
    sort === 'price-asc'
      ? ' ORDER BY p.price ASC'
      : sort === 'price-desc'
        ? ' ORDER BY p.price DESC'
        : sort === 'newest'
          ? ' ORDER BY p.created_at DESC'
          : ' ORDER BY p.featured DESC, p.created_at DESC'

  const rows = await sql.query(query, params)
  return rows.map(normalizeProduct)
}

async function getProductBySlug(slug: string) {
  const sql = await ensureDatabase()
  if (!sql) return getMemoryState().products.find((item) => item.slug === slug) || null

  const rows = await sql.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1`,
    [slug],
  )
  return rows[0] ? normalizeProduct(rows[0]) : null
}

async function createOrUpdateProduct(input: ProductInput, id?: string) {
  const sql = await ensureDatabase()
  const normalizedVariants = (input.variants || []).map((variant, index) => ({
    id: variant.id || `${id || input.slug || 'variant'}-${index + 1}`,
    name: variant.name || '',
    color: variant.color || '',
    imageUrl: variant.imageUrl || '',
    stock: Number(variant.stock || 0),
  }))
  if (!sql) {
    const state = getMemoryState()
    const existing = state.products.find((item) => item.id === id)
    const category = state.categories.find((item) => item.id === input.categoryId)
    const payload = {
      id: id || createId('prod'),
      slug: input.slug || input.name?.toLowerCase().replace(/\s+/g, '-') || createId('prod'),
      sku: input.sku || '',
      name: input.name || '',
      description: input.description || '',
      shortDescription: input.shortDescription || '',
      price: Number(input.price || 0),
      compareAtPrice: input.compareAtPrice || null,
      stock: Number(input.stock || 0),
      featured: Boolean(input.featured),
      badges: input.badges || [],
      imageUrls: input.imageUrls?.filter(Boolean) || [],
      variants: normalizedVariants,
      categoryId: input.categoryId || '',
      categoryName: category?.name || '',
      site: input.site || category?.site || 'anahinails',
      subcategory: input.subcategory || '',
    }
    if (existing) {
      Object.assign(existing, payload)
      return existing
    }
    state.products.unshift(payload)
    return payload
  }

  if (id) {
    await sql.query(
      `UPDATE products
       SET slug = $1, sku = $2, name = $3, description = $4, short_description = $5, price = $6, compare_at_price = $7,
           stock = $8, featured = $9, badges = $10::jsonb, image_urls = $11::jsonb, variants = $12::jsonb, subcategory = $13, site = $14, category_id = $15
       WHERE id = $16`,
      [
        input.slug,
        input.sku,
        input.name,
        input.description,
        input.shortDescription,
        input.price,
        input.compareAtPrice,
        input.stock,
        input.featured,
        JSON.stringify(input.badges || []),
        JSON.stringify(input.imageUrls || []),
        JSON.stringify(normalizedVariants),
        input.subcategory || null,
        input.site || 'anahinails',
        input.categoryId,
        id,
      ],
    )
    return getProductBySlug(input.slug || '')
  }

  const newId = createId('prod')
  await sql.query(
    `INSERT INTO products
      (id, slug, sku, name, description, short_description, price, compare_at_price, stock, featured, badges, image_urls, variants, subcategory, site, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $16)`,
    [
      newId,
      input.slug,
      input.sku,
      input.name,
      input.description,
      input.shortDescription,
      input.price,
      input.compareAtPrice,
      input.stock,
      input.featured,
      JSON.stringify(input.badges || []),
      JSON.stringify(input.imageUrls || []),
      JSON.stringify(normalizedVariants),
      input.subcategory || null,
      input.site || 'anahinails',
      input.categoryId,
    ],
  )
  return getProductBySlug(input.slug || '')
}

async function deleteProduct(id: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    getMemoryState().products = getMemoryState().products.filter((item) => item.id !== id)
    return
  }
  await sql.query('DELETE FROM products WHERE id = $1', [id])
}

async function createOrUpdateCategory(
  input: CategoryInput,
  id?: string,
) {
  const sql = await ensureDatabase()
  if (!sql) {
    const state = getMemoryState()
    const payload = {
      id: id || createId('cat'),
      slug: input.slug,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl || '',
      site: input.site || 'anahinails',
    }
    const existing = state.categories.find((item) => item.id === id)
    if (existing) {
      Object.assign(existing, payload)
      return existing
    }
    state.categories.push(payload)
    return payload
  }

  if (id) {
    await sql.query('UPDATE categories SET slug = $1, name = $2, description = $3, image_url = $4, site = $5 WHERE id = $6', [
      input.slug,
      input.name,
      input.description,
      input.imageUrl || null,
      input.site || 'anahinails',
      id,
    ])
    const rows = await sql.query('SELECT id, slug, name, description, image_url, site FROM categories WHERE id = $1', [id])
    return rows[0]
  }

  const newId = createId('cat')
  await sql.query(
    'INSERT INTO categories (id, slug, name, description, image_url, site) VALUES ($1, $2, $3, $4, $5, $6)',
    [newId, input.slug, input.name, input.description, input.imageUrl || null, input.site || 'anahinails'],
  )
  const rows = await sql.query('SELECT id, slug, name, description, image_url, site FROM categories WHERE id = $1', [newId])
  return rows[0]
}

async function deleteCategory(id: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    getMemoryState().categories = getMemoryState().categories.filter((item) => item.id !== id)
    return
  }
  await sql.query('DELETE FROM categories WHERE id = $1', [id])
}

async function createOrUpdateCoupon(input: CouponInput, id?: string) {
  const sql = await ensureDatabase()
  const payload = {
    id: id || createId('coupon'),
    code: normalizeCouponCode(input.code),
    description: input.description || '',
    type: input.type === 'fixed' ? 'fixed' : 'percentage',
    value: Number(input.value || 0),
    minSubtotal: input.minSubtotal ? Number(input.minSubtotal) : null,
    active: input.active ?? true,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    usageLimit: input.usageLimit ? Number(input.usageLimit) : null,
  }

  if (!sql) {
    const state = getMemoryState()
    const existing = state.coupons.find((item) => item.id === payload.id)
    const coupon = {
      ...payload,
      usageCount: existing ? Number(existing.usageCount || 0) : 0,
      createdAt: (existing?.createdAt as string | undefined) || new Date().toISOString(),
    }
    if (existing) {
      Object.assign(existing, coupon)
      return normalizeCoupon(existing)
    }
    state.coupons.unshift(coupon)
    return normalizeCoupon(coupon)
  }

  if (id) {
    await sql.query(
      `UPDATE discount_coupons
       SET code = $1, description = $2, type = $3, value = $4, min_subtotal = $5, active = $6, starts_at = $7, ends_at = $8, usage_limit = $9
       WHERE id = $10`,
      [
        payload.code,
        payload.description,
        payload.type,
        payload.value,
        payload.minSubtotal,
        payload.active,
        payload.startsAt,
        payload.endsAt,
        payload.usageLimit,
        id,
      ],
    )
    const rows = await sql.query('SELECT * FROM discount_coupons WHERE id = $1', [id])
    return normalizeCoupon(rows[0])
  }

  await sql.query(
    `INSERT INTO discount_coupons
      (id, code, description, type, value, min_subtotal, active, starts_at, ends_at, usage_limit)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      payload.id,
      payload.code,
      payload.description,
      payload.type,
      payload.value,
      payload.minSubtotal,
      payload.active,
      payload.startsAt,
      payload.endsAt,
      payload.usageLimit,
    ],
  )
  const rows = await sql.query('SELECT * FROM discount_coupons WHERE id = $1', [payload.id])
  return normalizeCoupon(rows[0])
}

async function deleteCoupon(id: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    getMemoryState().coupons = getMemoryState().coupons.filter((item) => item.id !== id)
    return
  }
  await sql.query('DELETE FROM discount_coupons WHERE id = $1', [id])
}

async function findCouponByCode(code?: string) {
  const normalizedCode = normalizeCouponCode(code)
  if (!normalizedCode) return null
  const sql = await ensureDatabase()
  if (!sql) {
    const found = getMemoryState().coupons.find((item) => String(item.code || '').toUpperCase() === normalizedCode)
    return found ? normalizeCoupon(found) : null
  }
  const rows = await sql.query('SELECT * FROM discount_coupons WHERE UPPER(code) = $1 LIMIT 1', [normalizedCode])
  return rows[0] ? normalizeCoupon(rows[0]) : null
}

async function incrementCouponUsage(couponId: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const coupon = getMemoryState().coupons.find((item) => item.id === couponId)
    if (coupon) coupon.usageCount = Number(coupon.usageCount || 0) + 1
    return
  }
  await sql.query('UPDATE discount_coupons SET usage_count = usage_count + 1 WHERE id = $1', [couponId])
}

async function validateCoupon(code: string | undefined, subtotal: number) {
  const normalizedCode = normalizeCouponCode(code)
  if (!normalizedCode) {
    return { valid: false, message: 'Ingresa un cupon.', subtotal, discountAmount: 0, total: subtotal }
  }

  const coupon = await findCouponByCode(normalizedCode)
  if (!coupon) {
    return { valid: false, message: 'Cupon no encontrado.', subtotal, discountAmount: 0, total: subtotal }
  }
  if (!coupon.active) {
    return { valid: false, message: 'Cupon inactivo.', subtotal, discountAmount: 0, total: subtotal }
  }

  const now = Date.now()
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { valid: false, message: 'Cupon todavia no disponible.', subtotal, discountAmount: 0, total: subtotal }
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    return { valid: false, message: 'Cupon vencido.', subtotal, discountAmount: 0, total: subtotal }
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      message: `Compra minima ${coupon.minSubtotal}.`,
      subtotal,
      discountAmount: 0,
      total: subtotal,
    }
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: 'Cupon sin usos disponibles.', subtotal, discountAmount: 0, total: subtotal }
  }

  const rawDiscount = coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value
  const discountAmount = roundMoney(Math.min(subtotal, rawDiscount))

  return {
    valid: true,
    message: 'Cupon aplicado.',
    coupon,
    subtotal,
    discountAmount,
    total: roundMoney(subtotal - discountAmount),
  }
}

function buildPreferenceItems(
  items: OrderPayload['items'],
  subtotal: number,
  discountAmount: number,
) {
  if (!discountAmount || subtotal <= 0) {
    return items.map((item) => ({ ...item, unitPrice: roundMoney(item.unitPrice) }))
  }

  let discountLeft = discountAmount
  return items.map((item, index) => {
    const lineSubtotal = item.unitPrice * item.quantity
    const lineDiscount =
      index === items.length - 1 ? discountLeft : roundMoney((lineSubtotal / subtotal) * discountAmount)
    discountLeft = roundMoney(discountLeft - lineDiscount)
    return {
      ...item,
      unitPrice: roundMoney(Math.max(0, lineSubtotal - lineDiscount) / item.quantity),
    }
  })
}

async function createOrder(body: OrderPayload) {
  const sql = await ensureDatabase()
  const subtotal = roundMoney(body.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0))
  const couponValidation = body.couponCode
    ? await validateCoupon(body.couponCode, subtotal)
    : { valid: false, subtotal, discountAmount: 0, total: subtotal }

  if (body.couponCode && !couponValidation.valid) {
    throw new Error(couponValidation.message || 'No se pudo aplicar el cupon.')
  }

  const order = {
    id: createId('order'),
    orderNumber: createOrderNumber(),
    ...body,
    couponCode: couponValidation.valid ? couponValidation.coupon?.code : undefined,
    couponId: couponValidation.valid ? couponValidation.coupon?.id : undefined,
    status: 'pending',
    subtotal,
    discountAmount: couponValidation.discountAmount,
    total: couponValidation.total,
    createdAt: new Date().toISOString(),
  }

  if (!sql) {
    getMemoryState().orders.unshift(order)
    if (couponValidation.valid && couponValidation.coupon?.id) {
      await incrementCouponUsage(couponValidation.coupon.id)
    }
    return order
  }

  await sql.query(
    `INSERT INTO orders
      (id, order_number, customer_name, email, phone, address, city, province, postal_code, notes, send_whatsapp_summary, coupon_id, coupon_code, subtotal, discount_amount, total, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      order.id,
      order.orderNumber,
      order.customerName,
      order.email,
      order.phone,
      order.address,
      order.city,
      order.province,
      order.postalCode,
      order.notes || '',
      Boolean(order.sendWhatsAppSummary),
      order.couponId || null,
      order.couponCode || null,
      order.subtotal,
      order.discountAmount,
      order.total,
      order.status,
    ],
  )

  for (const item of body.items) {
    await sql.query(
      'INSERT INTO detail_pedido (id, order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)',
      [createId('detail'), order.id, item.productId, item.quantity, item.unitPrice],
    )
  }

  if (couponValidation.valid && couponValidation.coupon?.id) {
    await incrementCouponUsage(couponValidation.coupon.id)
  }

  return order
}

async function listOrders() {
  const sql = await ensureDatabase()
  if (!sql) return getMemoryState().orders
  const rows = await sql.query(
    `SELECT id, order_number, customer_name, email, phone, address, city, province, postal_code, notes,
            send_whatsapp_summary, coupon_id, coupon_code, subtotal, discount_amount, total, status, created_at
     FROM orders
     ORDER BY created_at DESC`,
  )
  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    notes: row.notes,
    sendWhatsAppSummary: row.send_whatsapp_summary,
    couponId: row.coupon_id,
    couponCode: row.coupon_code,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount || 0),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
    items: [],
  }))
}

async function updateOrderStatus(id: string, status: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const order = getMemoryState().orders.find((item) => item.id === id)
    if (order) order.status = status
    return order
  }
  await sql.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id])
  const rows = await sql.query(
    'SELECT id, order_number, customer_name, email, phone, address, city, province, postal_code, notes, send_whatsapp_summary, coupon_id, coupon_code, subtotal, discount_amount, total, status, created_at FROM orders WHERE id = $1',
    [id],
  )
  const row = rows[0]
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    notes: row.notes,
    sendWhatsAppSummary: row.send_whatsapp_summary,
    couponId: row.coupon_id,
    couponCode: row.coupon_code,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount || 0),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  }
}

async function generateMercadoPagoPreference(body: OrderPayload) {
  const subtotal = roundMoney(body.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0))
  const couponValidation = body.couponCode
    ? await validateCoupon(body.couponCode, subtotal)
    : { valid: false, subtotal, discountAmount: 0, total: subtotal }

  if (body.couponCode && !couponValidation.valid) {
    throw new Error(couponValidation.message || 'No se pudo aplicar el cupon.')
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return { preferenceId: 'pending-config', initPoint: '', sandboxInitPoint: '' }
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 },
  })
  const preference = new Preference(client)
  const pricedItems = buildPreferenceItems(body.items, subtotal, couponValidation.discountAmount)

  const result = await preference.create({
    body: {
      items: pricedItems.map((item, index) => ({
        id: item.productId || `item-${index}`,
        title: item.productName || `Producto ${index + 1}`,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'ARS',
      })),
      payer: {
        name: body.customerName,
        email: body.email,
      },
      external_reference: createOrderNumber(),
      back_urls: {
        success: process.env.CHECKOUT_SUCCESS_URL || '',
        failure: process.env.CHECKOUT_FAILURE_URL || '',
        pending: process.env.CHECKOUT_PENDING_URL || '',
      },
      auto_return: 'approved',
    },
  })

  return {
    preferenceId: result.id,
    initPoint: 'init_point' in result ? String(result.init_point || '') : '',
    sandboxInitPoint: 'sandbox_init_point' in result ? String(result.sandbox_init_point || '') : '',
  }
}

function getWhatsAppOrderLink(order: { orderNumber: string; customerName: string; total: number }) {
  const number = process.env.VITE_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '5490000000000'
  const message = `Hola! Quiero confirmar el pedido ${order.orderNumber} de ${order.customerName}. Total: $${order.total}.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export const handler: Handler = async (event) => {
  try {
    const url = new URL(event.rawUrl)
    const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, '')
    const method = event.httpMethod

    if (method === 'GET' && path === '/storefront') {
      const site = (url.searchParams.get('site') || 'anahinails').toLowerCase()
      const storefrontParams = new URLSearchParams(url.searchParams)
      storefrontParams.set('sort', storefrontParams.get('sort') || 'featured')
      storefrontParams.set('site', site)
      const categories = await listCategories(site)
      const products = await listProducts(storefrontParams)
      return json(200, {
        categories,
        featuredProducts: products.slice(0, 4),
        bestSellers: products.filter((item) => item.badges?.includes('best-seller')).slice(0, 4),
        newArrivals: products.filter((item) => item.badges?.includes('new')).slice(0, 4),
      })
    }

    if (method === 'GET' && path === '/categories') {
      return json(200, await listCategories(url.searchParams.get('site') || undefined))
    }

    if (method === 'GET' && path === '/products') {
      return json(200, await listProducts(url.searchParams))
    }

    if (method === 'GET' && path.startsWith('/products/')) {
      const product = await getProductBySlug(path.split('/').pop() || '')
      if (!product) return json(404, { message: 'Producto no encontrado.' })
      return json(200, product)
    }

    if (method === 'POST' && path === '/admin/login') {
      const body = parseBody<{ email: string; password: string }>(event.body)
      const normalizedEmail = body.email.trim().toLowerCase()
      const sql = await ensureDatabase()
      const user = sql
        ? (await sql.query('SELECT id, name, email, password_hash FROM users_admin WHERE LOWER(email) = $1', [normalizedEmail]))[0]
        : await getMemoryAdmin()
      if (!user) return json(401, { message: 'Credenciales invalidas.' })
      const isValid = await verifyPassword(body.password, user.password_hash || user.passwordHash)
      if (!isValid) return json(401, { message: 'Credenciales invalidas.' })
      const normalized = { id: user.id, email: user.email, name: user.name }
      return json(200, { token: signAdminToken(normalized), user: normalized })
    }

    if (path.startsWith('/admin')) {
      requireAdmin(event)
    }

    if (method === 'GET' && path === '/admin/products') {
      return json(200, await listProducts(new URLSearchParams('sort=featured')))
    }
    if (method === 'POST' && path === '/admin/products') {
      return json(200, await createOrUpdateProduct(parseBody(event.body)))
    }
    if (method === 'PUT' && path.startsWith('/admin/products/')) {
      return json(200, await createOrUpdateProduct(parseBody(event.body), path.split('/').pop() || ''))
    }
    if (method === 'DELETE' && path.startsWith('/admin/products/')) {
      await deleteProduct(path.split('/').pop() || '')
      return json(200, { success: true })
    }

    if (method === 'GET' && path === '/admin/categories') {
      return json(200, await listCategories())
    }
    if (method === 'POST' && path === '/admin/categories') {
      return json(200, await createOrUpdateCategory(parseBody(event.body)))
    }
    if (method === 'PUT' && path.startsWith('/admin/categories/')) {
      return json(200, await createOrUpdateCategory(parseBody(event.body), path.split('/').pop() || ''))
    }
    if (method === 'DELETE' && path.startsWith('/admin/categories/')) {
      await deleteCategory(path.split('/').pop() || '')
      return json(200, { success: true })
    }

    if (method === 'GET' && path === '/admin/orders') {
      return json(200, await listOrders())
    }
    if (method === 'PUT' && path.match(/^\/admin\/orders\/[^/]+\/status$/)) {
      const body = parseBody<{ status: string }>(event.body)
      return json(200, await updateOrderStatus(path.split('/')[3], body.status))
    }

    if (method === 'GET' && path === '/admin/coupons') {
      return json(200, await listCoupons())
    }
    if (method === 'POST' && path === '/admin/coupons') {
      return json(200, await createOrUpdateCoupon(parseBody(event.body)))
    }
    if (method === 'PUT' && path.startsWith('/admin/coupons/')) {
      return json(200, await createOrUpdateCoupon(parseBody(event.body), path.split('/').pop() || ''))
    }
    if (method === 'DELETE' && path.startsWith('/admin/coupons/')) {
      await deleteCoupon(path.split('/').pop() || '')
      return json(200, { success: true })
    }

    if (method === 'POST' && path === '/coupons/validate') {
      const body = parseBody<{ couponCode?: string; subtotal?: number }>(event.body)
      return json(200, await validateCoupon(body.couponCode, Number(body.subtotal || 0)))
    }

    if (method === 'POST' && path === '/orders') {
      const order = await createOrder(parseBody(event.body))
      return json(200, {
        order,
        whatsappUrl: order.sendWhatsAppSummary ? getWhatsAppOrderLink(order) : undefined,
      })
    }

    if (method === 'POST' && path === '/checkout/create-preference') {
      return json(200, await generateMercadoPagoPreference(parseBody(event.body)))
    }

    if (method === 'POST' && path === '/cloudinary/signature') {
      const { folder } = parseBody<{ folder?: string }>(event.body)
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || ''
      const apiKey = process.env.CLOUDINARY_API_KEY || ''
      const apiSecret = process.env.CLOUDINARY_API_SECRET || ''
      if (!cloudName || !apiKey || !apiSecret) {
        return json(400, { message: 'Faltan credenciales de Cloudinary.' })
      }
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
      const timestamp = Math.round(Date.now() / 1000)
      const finalFolder = folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'anahi-nails-diamond/products'
      const signature = cloudinary.utils.api_sign_request({ timestamp, folder: finalFolder }, apiSecret)
      return json(200, { timestamp, signature, apiKey, cloudName, folder: finalFolder })
    }

    return json(404, { message: 'Ruta no encontrada.' })
  } catch (error) {
    return json(500, { message: error instanceof Error ? error.message : 'Error interno.' })
  }
}
