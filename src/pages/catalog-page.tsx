import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, Search, X } from 'lucide-react'
import { startTransition, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/product-card'
import { ProductFilters } from '../components/catalog/product-filters'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'
import type { StoreSite } from '../types'

export function CatalogPage({ site = 'anahinails' }: { site?: StoreSite }) {
  useSEO({ title: 'Productos', description: 'Catalogo de productos filtrado por marca y listo para crecer con subcategorias y variantes.' })
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    brand: searchParams.get('brand') || '',
    sort: searchParams.get('sort') || 'featured',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featuredOnly: searchParams.get('featured') === 'true',
  })

  const categoryQuery = useQuery({
    queryKey: ['categories', site],
    queryFn: () => api.categories(site),
  })

  const productQuery = useQuery({
    queryKey: ['products', site, searchParams.toString()],
    queryFn: () => {
      const next = new URLSearchParams(searchParams)
      next.set('site', site)
      return api.products(next)
    },
  })

  const handleChange = (field: string, value: string | boolean) => {
    setLocalFilters((current) => ({
      ...current,
      [field]: value,
      ...(field === 'category' ? { subcategory: '', brand: '' } : {}),
    }))
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      const mappedField = field === 'search' ? 'q' : field === 'featuredOnly' ? 'featured' : field
      if (value === '' || value === false) {
        next.delete(mappedField)
      } else {
        next.set(mappedField, String(value))
      }
      if (field === 'category') {
        next.delete('subcategory')
        next.delete('brand')
      }
      setSearchParams(next, { replace: true })
    })
  }

  const totalLabel = useMemo(() => {
    const count = productQuery.data?.length || 0
    return `${count} productos`
  }, [productQuery.data])
  const subcategories = useMemo(
    () => {
      const selectedCategory = (categoryQuery.data || []).find((item) => item.slug === localFilters.category)
      const fromCategory = selectedCategory?.subcategories || []
      if (fromCategory.length > 0) {
        return [...fromCategory].sort((left, right) => left.localeCompare(right))
      }
      return Array.from(
        new Set((productQuery.data || []).map((item) => item.subcategory).filter(Boolean) as string[]),
      ).sort((left, right) => left.localeCompare(right))
    },
    [categoryQuery.data, localFilters.category, productQuery.data],
  )
  const brands = useMemo(
    () =>
      Array.from(
        new Set((productQuery.data || []).map((item) => item.brand).filter(Boolean) as string[]),
      ).sort((left, right) => left.localeCompare(right)),
    [productQuery.data],
  )

  return (
    <section className="bg-[#fff7f7] py-10">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Catálogo</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-[var(--color-primary)] sm:text-4xl">
            Todos los productos
            </h1>
          </div>
          <p className="rounded-full bg-[var(--color-surface-card)] px-4 py-2 text-sm font-medium text-[var(--color-muted)] shadow-sm">{totalLabel}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-4">
          <aside className="hidden lg:col-span-1 lg:block">
            <div className="sticky top-24">
            <ProductFilters
              categories={categoryQuery.data || []}
              category={localFilters.category}
              subcategory={localFilters.subcategory}
              subcategories={subcategories}
              brand={localFilters.brand}
              brands={brands}
              sort={localFilters.sort}
              minPrice={localFilters.minPrice}
              maxPrice={localFilters.maxPrice}
              featuredOnly={localFilters.featuredOnly}
              onChange={handleChange}
            />
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-3">
            <div className="mb-5 flex gap-3">
              <label className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
                <input
                  value={localFilters.search}
                  onChange={(event) => handleChange('search', event.target.value)}
                  placeholder="Buscar productos, marcas o categorías..."
                  className="w-full bg-transparent px-5 py-4 text-base text-[var(--color-primary)] outline-none placeholder:text-zinc-400"
                />
                <span className="px-5 text-[var(--color-primary)]"><Search size={21} /></span>
              </label>
              <button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 text-sm font-semibold text-[var(--color-primary)] shadow-[0_10px_24px_rgba(17,24,39,0.04)] lg:hidden">
                <SlidersHorizontal size={18} />
                Filtros
              </button>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-muted)]">Explorá los productos o usá los filtros para afinar tu búsqueda.</p>
              {productQuery.isFetching ? <span className="text-xs font-semibold text-[var(--color-accent)]">Actualizando...</span> : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {productQuery.data?.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {productQuery.data?.length === 0 ? <p className="rounded-3xl bg-[var(--color-surface-card)] p-10 text-center text-[var(--color-muted)]">No encontramos productos con esos filtros.</p> : null}
          </div>

        </div>

        {mobileFiltersOpen ? <div className="fixed inset-0 z-[70] bg-black/45 p-4 lg:hidden" onClick={() => setMobileFiltersOpen(false)}><div className="ml-auto h-full w-full max-w-sm overflow-y-auto rounded-[2rem] bg-[var(--color-surface-card)] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between px-2"><h2 className="font-display text-xl font-bold">Filtros</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-full border border-[var(--color-border)] p-2"><X size={18} /></button></div><ProductFilters categories={categoryQuery.data || []} category={localFilters.category} subcategory={localFilters.subcategory} subcategories={subcategories} brand={localFilters.brand} brands={brands} sort={localFilters.sort} minPrice={localFilters.minPrice} maxPrice={localFilters.maxPrice} featuredOnly={localFilters.featuredOnly} onChange={handleChange} /></div></div> : null}
      </div>
    </section>
  )
}
