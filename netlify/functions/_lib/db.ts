import { neon } from '@neondatabase/serverless'
import { hashPassword } from './auth'
import { seedCategories, seedProducts } from './seed'

type SqlClient = ReturnType<typeof neon>
type MemoryOrder = Record<string, unknown>

let initialized = false
const memoryState = {
  categories: structuredClone(seedCategories),
  products: structuredClone(seedProducts),
  orders: [] as MemoryOrder[],
  coupons: [] as Record<string, unknown>[],
  admin: {
    id: 'admin-seed',
    email: process.env.ADMIN_SEED_EMAIL || 'admin@anahinailsdiamond.com',
    name: process.env.ADMIN_SEED_NAME || 'Admin',
    passwordHash: '',
  },
}

async function getSql(): Promise<SqlClient | null> {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return neon(url)
}

export async function ensureDatabase() {
  const sql = await getSql()
  if (!sql || initialized) return sql

  const setupStatements = [
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      site TEXT NOT NULL DEFAULT 'anahinails',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      compare_at_price NUMERIC(12,2),
      stock INTEGER NOT NULL DEFAULT 0,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      badges JSONB NOT NULL DEFAULT '[]'::jsonb,
      image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
      variants JSONB NOT NULL DEFAULT '[]'::jsonb,
      subcategory TEXT,
      site TEXT NOT NULL DEFAULT 'anahinails',
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS users_admin (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      notes TEXT,
      send_whatsapp_summary BOOLEAN NOT NULL DEFAULT FALSE,
      coupon_id TEXT,
      coupon_code TEXT,
      subtotal NUMERIC(12,2) NOT NULL,
      discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS discount_coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      value NUMERIC(12,2) NOT NULL,
      min_subtotal NUMERIC(12,2),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      usage_limit INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS detail_pedido (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL
    )`,
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id TEXT',
    'ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT',
    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0",
    "ALTER TABLE categories ADD COLUMN IF NOT EXISTS site TEXT NOT NULL DEFAULT 'anahinails'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb",
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT',
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS site TEXT NOT NULL DEFAULT 'anahinails'",
  ]

  for (const statement of setupStatements) {
    await sql.query(statement)
  }

  const categoryCount = await sql.query('SELECT COUNT(*)::int AS count FROM categories')
  if ((categoryCount[0]?.count || 0) === 0) {
    for (const category of seedCategories) {
      await sql.query(
        'INSERT INTO categories (id, slug, name, description, site) VALUES ($1, $2, $3, $4, $5)',
        [category.id, category.slug, category.name, category.description, category.site],
      )
    }
  }

  const productCount = await sql.query('SELECT COUNT(*)::int AS count FROM products')
  if ((productCount[0]?.count || 0) === 0) {
    for (const product of seedProducts) {
      await sql.query(
        `INSERT INTO products
          (id, slug, sku, name, description, short_description, price, compare_at_price, stock, featured, badges, image_urls, variants, subcategory, site, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $16)`,
        [
          product.id,
          product.slug,
          product.sku,
          product.name,
          product.description,
          product.shortDescription,
          product.price,
          product.compareAtPrice,
          product.stock,
          product.featured,
          JSON.stringify(product.badges),
          JSON.stringify(product.imageUrls),
          JSON.stringify(product.variants || []),
          product.subcategory || null,
          product.site,
          product.categoryId,
        ],
      )
    }
  }

  const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@anahinailsdiamond.com'
  const seedName = process.env.ADMIN_SEED_NAME || 'Admin'
  const seedHash = await hashPassword(process.env.ADMIN_SEED_PASSWORD || 'admin123456')
  const existingSeed = await sql.query(
    'SELECT id FROM users_admin WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1',
    ['admin-seed', seedEmail],
  )
  if (existingSeed[0]?.id) {
    await sql.query(
      'UPDATE users_admin SET id = $1, name = $2, email = $3, password_hash = $4 WHERE id = $5',
      ['admin-seed', seedName, seedEmail, seedHash, existingSeed[0].id],
    )
  } else {
    await sql.query(
      'INSERT INTO users_admin (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      ['admin-seed', seedName, seedEmail, seedHash],
    )
  }

  initialized = true
  return sql
}

export async function getMemoryAdmin() {
  if (!memoryState.admin.passwordHash) {
    memoryState.admin.passwordHash = await hashPassword(
      process.env.ADMIN_SEED_PASSWORD || 'admin123456',
    )
  }
  return memoryState.admin
}

export function getMemoryState() {
  return memoryState
}
