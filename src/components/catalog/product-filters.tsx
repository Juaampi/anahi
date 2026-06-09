import { BadgePercent, ChevronRight, LayoutGrid, SlidersHorizontal, Sparkles, Tag } from 'lucide-react'
import type { Category } from '../../types'
import { cn } from '../../lib/utils'

interface ProductFiltersProps {
  categoryListTitle?: string
  categories: Category[]
  category: string
  sort: string
  minPrice: string
  maxPrice: string
  featuredOnly: boolean
  onChange: (field: string, value: string | boolean) => void
}

export function ProductFilters(props: ProductFiltersProps) {
  const { categories, category, sort, minPrice, maxPrice, featuredOnly, onChange } = props

  return (
    <aside className="space-y-5 rounded-[26px] border border-[var(--color-border)] bg-white p-6 text-[var(--color-primary)] shadow-[0_18px_38px_rgba(17,24,39,0.05)]">
      <div className="rounded-[22px] bg-[linear-gradient(135deg,#faf4ff_0%,#fff8fb_100%)] p-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--color-primary)] shadow-sm">
          <LayoutGrid size={16} className="text-[#b06cff]" />
          Todos los productos
        </span>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChange('sort', 'newest')}
          className={cn(
            'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition',
            sort === 'newest'
              ? 'bg-[#faf4ff] text-[var(--color-primary)]'
              : 'text-[var(--color-muted)] hover:bg-[#faf7f5]',
          )}
        >
          <span className="flex items-center gap-3">
            <Sparkles size={16} className="text-[#b06cff]" />
            Nuevos ingresos
          </span>
          <ChevronRight size={16} className="text-[#b06cff]" />
        </button>

        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange('category', category === item.slug ? '' : item.slug)}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition',
              category === item.slug
                ? 'bg-[#faf4ff] text-[var(--color-primary)]'
                : 'text-[var(--color-muted)] hover:bg-[#faf7f5]',
            )}
          >
            <span>{item.name}</span>
            <ChevronRight size={16} className="text-[#b06cff]" />
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-[24px] border border-[var(--color-border)] bg-[#fffaf8] p-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            <SlidersHorizontal size={14} />
            Filtros
          </p>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <Tag size={15} className="text-[var(--color-accent)]" />
            Orden
          </label>
          <select
            value={sort}
            onChange={(event) => onChange('sort', event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-primary)] outline-none"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="newest">Mas nuevos</option>
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <BadgePercent size={15} className="text-[var(--color-accent)]" />
            Precio
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={minPrice}
              onChange={(event) => onChange('minPrice', event.target.value)}
              placeholder="Min"
              className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-primary)] outline-none placeholder:text-[var(--color-muted)]"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(event) => onChange('maxPrice', event.target.value)}
              placeholder="Max"
              className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-primary)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-primary)]">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => onChange('featuredOnly', event.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          Mostrar solo destacados
        </label>
      </div>
    </aside>
  )
}
