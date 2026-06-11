import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { ProductCard } from '../catalog/product-card'

export function FeaturedGrid({
  title,
  subtitle,
  products,
}: {
  title: string
  subtitle: string
  products: Product[]
}) {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            PRODUCTOS DESTACADOS
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">{subtitle}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/productos"
            className="btn-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold shadow-[0_14px_30px_rgba(17,24,39,0.14)]"
          >
            Ver más productos
          </Link>
        </div>
      </div>
    </section>
  )
}
