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
    categoryId: row.category_id ?? row.categoryId,
    categoryName: row.category_name ?? row.categoryName,
    createdAt: row.created_at ?? row.createdAt,
  }
}

async function listCategories() {
  const sql = await ensureDatabase()
  if (!sql) return getMemoryState().categories
  return sql.query('SELECT id, slug, name, description, image_url FROM categories ORDER BY name ASC')
}

async function listProducts(searchParams: URLSearchParams) {
  const sql = await ensureDatabase()
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.toLowerCase()
  const featured = searchParams.get('featured')
  const minPrice = Number(searchParams.get('minPrice') || 0)
  const maxPrice = Number(searchParams.get('maxPrice') || 0)
  const sort = searchParams.get('sort') || 'featured'

  if (!sql) {
    let items = [...getMemoryState().products]
    if (category) items = items.filter((item) => item.categoryName.toLowerCase().includes(category.toLowerCase()) || item.categoryId === category || item.slug.includes(category))
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
  if (q) {
    params.push(`%${q}%`)
    query += ` AND LOWER(p.name) LIKE $${params.length}`
  }
  if (featured === 'true') {
    query += ' AND p.featured = TRUE'
  }
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

function sortProducts(items: Array<Record<string, unknown> & { price: number; featured: boolean }>, sort: string) {
  const clone = [...items]
  if (sort === 'price-asc') return clone.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return clone.sort((a, b) => b.price - a.price)
  if (sort === 'newest') return clone.reverse()
  return clone.sort((a, b) => Number(b.featured) - Number(a.featured))
}

async function getProductBySlug(slug: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const product = getMemoryState().products.find((item) => item.slug === slug)
    if (!product) return null
    return product
  }

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
      categoryId: input.categoryId || '',
      categoryName: category?.name || '',
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
           stock = $8, featured = $9, badges = $10::jsonb, image_urls = $11::jsonb, category_id = $12
       WHERE id = $13`,
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
        input.categoryId,
        id,
      ],
    )
    return getProductBySlug(input.slug || '')
  }

  const newId = createId('prod')
  await sql.query(
    `INSERT INTO products
      (id, slug, sku, name, description, short_description, price, compare_at_price, stock, featured, badges, image_urls, category_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)`,
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
      input.categoryId,
    ],
  )
  return getProductBySlug(input.slug || '')
}

async function deleteProduct(id: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const state = getMemoryState()
    state.products = state.products.filter((item) => item.id !== id)
    return
  }
  await sql.query('DELETE FROM products WHERE id = $1', [id])
}

async function createOrUpdateCategory(
  input: { slug: string; name: string; description: string },
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
    await sql.query('UPDATE categories SET slug = $1, name = $2, description = $3 WHERE id = $4', [
      input.slug,
      input.name,
      input.description,
      id,
    ])
    const rows = await sql.query('SELECT id, slug, name, description FROM categories WHERE id = $1', [id])
    return rows[0]
  }

  const newId = createId('cat')
  await sql.query(
    'INSERT INTO categories (id, slug, name, description) VALUES ($1, $2, $3, $4)',
    [newId, input.slug, input.name, input.description],
  )
  const rows = await sql.query('SELECT id, slug, name, description FROM categories WHERE id = $1', [newId])
  return rows[0]
}

async function deleteCategory(id: string) {
  const sql = await ensureDatabase()
  if (!sql) {
    const state = getMemoryState()
    state.categories = state.categories.filter((item) => item.id !== id)
    return
  }
  await sql.query('DELETE FROM categories WHERE id = $1', [id])
}

async function createOrder(body: OrderPayload) {
  const sql = await ensureDatabase()
  const subtotal = body.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
  const order = {
    id: createId('order'),
    orderNumber: createOrderNumber(),
    ...body,
    status: 'pending',
    subtotal,
    total: subtotal,
    createdAt: new Date().toISOString(),
  }

  if (!sql) {
    getMemoryState().orders.unshift(order)
    return order
  }

  await sql.query(
    `INSERT INTO orders
      (id, order_number, customer_name, email, phone, address, city, province, postal_code, notes, send_whatsapp_summary, subtotal, total, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
      order.subtotal,
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

  return order
}

async function listOrders() {
  const sql = await ensureDatabase()
  if (!sql) return getMemoryState().orders
  const rows = await sql.query(
    `SELECT id, order_number, customer_name, email, phone, address, city, province, postal_code, notes,
            send_whatsapp_summary, subtotal, total, status, created_at
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
    subtotal: Number(row.subtotal),
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
    'SELECT id, order_number, customer_name, email, phone, address, city, province, postal_code, notes, send_whatsapp_summary, subtotal, total, status, created_at FROM orders WHERE id = $1',
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
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  }
}

async function generateMercadoPagoPreference(body: OrderPayload) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return { preferenceId: 'pending-config', initPoint: '', sandboxInitPoint: '' }
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 },
  })
  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: body.items.map((item, index) => ({
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
      const categories = await listCategories()
      const products = await listProducts(new URLSearchParams('sort=featured'))
      return json(200, {
        categories,
        featuredProducts: products.slice(0, 4),
        bestSellers: products.filter((item) => item.badges?.includes('best-seller')).slice(0, 4),
        newArrivals: products.filter((item) => item.badges?.includes('new')).slice(0, 4),
      })
    }

    if (method === 'GET' && path === '/categories') {
      return json(200, await listCategories())
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
      const sql = await ensureDatabase()
      const user = sql
        ? (await sql.query('SELECT id, name, email, password_hash FROM users_admin WHERE email = $1', [body.email]))[0]
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
      const body = parseBody<ProductInput>(event.body)
      return json(200, await createOrUpdateProduct(body))
    }
    if (method === 'PUT' && path.startsWith('/admin/products/')) {
      const body = parseBody<ProductInput>(event.body)
      return json(200, await createOrUpdateProduct(body, path.split('/').pop() || ''))
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
      const orderId = path.split('/')[3]
      return json(200, await updateOrderStatus(orderId, body.status))
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
