import { Search, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { getProductFallbackImage } from '../../lib/constants'
import { buildStorePath, formatCurrency } from '../../lib/utils'
import { useCartStore } from '../../store/cart-store'
import { SmartImage } from '../ui/smart-image'

const badgeLabels = {
  new: 'Nuevo',
  sale: 'Tendencia',
  'best-seller': 'Tendencia',
}

function getStockLabel(stock: number) {
  if (stock <= 0) return 'Sin stock'
  if (stock <= 4) return `Quedan ${stock}`
  return 'Disponible'
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const firstBadge = product.badges[0]
  const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price)

  return (
    <article className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(17,24,39,0.09)]">
      <Link to={buildStorePath(product.site, `/productos/${product.slug}`)} className="block">
        <div className="relative rounded-[20px] bg-[linear-gradient(180deg,#ffffff_0%,#fff7f4_100%)] px-4 pb-4 pt-12">
          {firstBadge ? (
            <span className="absolute left-4 top-4 rounded-full bg-[linear-gradient(135deg,#ff9f43_0%,#ff6f3c_100%)] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(255,111,60,0.28)]">
              {badgeLabels[firstBadge]}
            </span>
          ) : null}
          <SmartImage
            src={product.imageUrls[0]}
            fallbackSrc={getProductFallbackImage(product.categoryName, product.name)}
            alt={product.name}
            className="mx-auto aspect-square w-full max-w-[220px] object-contain"
          />
        </div>
      </Link>

      <div className="px-2 pb-2 pt-5">
        <h3 className="min-h-[72px] font-display text-[1.05rem] font-black uppercase leading-7 text-[var(--color-primary)]">
          <Link to={buildStorePath(product.site, `/productos/${product.slug}`)}>{product.name}</Link>
        </h3>
        {product.subcategory || product.brand ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {[product.categoryName, product.subcategory, product.brand].filter(Boolean).join(' · ')}
          </p>
        ) : null}

        <p className="mt-4 text-[0.95rem] font-medium leading-7 text-[#00a651]">
          Mismo precio en
          <br />
          3 cuotas sin interés
        </p>

        <div className="mt-2">
          <div className="flex items-end gap-2">
            <span className="text-xl text-[var(--color-primary)]">$</span>
            <strong className="font-display text-[2rem] font-black leading-none text-[var(--color-primary)]">
              {formatCurrency(product.price).replace('$', '').trim()}
            </strong>
          </div>
          {product.compareAtPrice ? (
            <p className="mt-1 text-[1.05rem] font-bold text-zinc-500 line-through">
              {formatCurrency(product.compareAtPrice)}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-[#dff5e8] px-3 py-1 text-sm font-bold text-[#00a651]">
            -15% Efectivo
          </span>
          <span className="rounded-md bg-[#dff5e8] px-3 py-1 text-sm font-bold text-[#00a651]">
            -5% Transferencia
          </span>
          {!hasDiscount ? (
            <span className="rounded-md bg-[#eef0ff] px-3 py-1 text-sm font-bold text-[#7c73ff]">
              {getStockLabel(product.stock)}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          <Link
            to={buildStorePath(product.site, `/productos/${product.slug}`)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Search size={15} />
            Ver producto
          </Link>
          <button
            onClick={() => addItem(product)}
            className="btn-primary inline-flex h-12 w-12 items-center justify-center rounded-full shadow-[0_10px_24px_rgba(17,24,39,0.14)] transition"
            aria-label={`Agregar ${product.name}`}
          >
            <ShoppingBag size={17} />
          </button>
        </div>
      </div>
    </article>
  )
}
