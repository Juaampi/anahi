import { Link } from 'react-router-dom'
import { getCategoryImage } from '../../lib/constants'
import type { Category } from '../../types'
import { SmartImage } from '../ui/smart-image'

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <section id="kx-categorias" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            CATEGORÍAS
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            Categorías más visitadas
          </h2>
          <p className="mt-4 text-base text-[var(--color-muted)]">Entrá rápido a lo que necesitás para tu trabajo.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/productos?category=${category.slug}`}
              className="group overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-[0_14px_40px_rgba(17,24,39,0.05)]"
            >
              <SmartImage
                src={category.imageUrl || getCategoryImage(category.slug)}
                fallbackSrc={getCategoryImage(category.slug)}
                alt={category.name}
                className="aspect-[4/3.3] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{category.name}</h3>
                <span className="mt-2 inline-flex text-sm font-medium text-[var(--color-muted)]">Ver productos</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/productos"
            className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-primary)]"
          >
            Ver todo
          </Link>
        </div>
      </div>
    </section>
  )
}
