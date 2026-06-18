CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  site TEXT NOT NULL DEFAULT 'anahinails',
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
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  subcategory TEXT,
  site TEXT NOT NULL DEFAULT 'anahinails',
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
  coupon_id TEXT,
  coupon_code TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_coupons (
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
);

CREATE TABLE IF NOT EXISTS detail_pedido (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL
);
