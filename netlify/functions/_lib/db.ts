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

  await sql.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
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
      category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users_admin (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS orders (
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
      subtotal NUMERIC(12,2) NOT NULL,
      total NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS detail_pedido (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL
    );
  `)

  const categoryCount = await sql.query('SELECT COUNT(*)::int AS count FROM categories')
  if ((categoryCount[0]?.count || 0) === 0) {
    for (const category of seedCategories) {
      await sql.query(
        'INSERT INTO categories (id, slug, name, description) VALUES ($1, $2, $3, $4)',
        [category.id, category.slug, category.name, category.description],
      )
    }
  }

  const productCount = await sql.query('SELECT COUNT(*)::int AS count FROM products')
  if ((productCount[0]?.count || 0) === 0) {
    for (const product of seedProducts) {
      await sql.query(
        `INSERT INTO products
          (id, slug, sku, name, description, short_description, price, compare_at_price, stock, featured, badges, image_urls, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)`,
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
          product.categoryId,
        ],
      )
    }
  }

  const adminCount = await sql.query('SELECT COUNT(*)::int AS count FROM users_admin')
  if ((adminCount[0]?.count || 0) === 0) {
    await sql.query(
      'INSERT INTO users_admin (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [
        'admin-seed',
        process.env.ADMIN_SEED_NAME || 'Admin',
        process.env.ADMIN_SEED_EMAIL || 'admin@anahinailsdiamond.com',
        await hashPassword(process.env.ADMIN_SEED_PASSWORD || 'admin123456'),
      ],
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
