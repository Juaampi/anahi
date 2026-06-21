import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
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
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
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
      ...(field === 'category' ? { subcategory: '' } : {}),
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

  return (
    <section className="bg-[#fff7f7] py-10">
      <div className="mx-auto max-w-[1680px] px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-[var(--color-primary)]">
            Todos los productos
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">{totalLabel}</p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <div className="order-2 xl:order-1">
            <ProductFilters
              categories={categoryQuery.data || []}
              category={localFilters.category}
              subcategory={localFilters.subcategory}
              subcategories={subcategories}
              sort={localFilters.sort}
              minPrice={localFilters.minPrice}
              maxPrice={localFilters.maxPrice}
              featuredOnly={localFilters.featuredOnly}
              onChange={handleChange}
            />
          </div>

          <div className="order-1 min-w-0 xl:order-2">
            <label className="mb-5 flex items-center overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
              <input
                value={localFilters.search}
                onChange={(event) => handleChange('search', event.target.value)}
                placeholder="Buscar..."
                className="w-full bg-transparent px-5 py-4 text-lg text-[var(--color-primary)] outline-none placeholder:text-zinc-400"
              />
              <span className="px-5 text-[var(--color-primary)]">
                <Search size={24} />
              </span>
            </label>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {productQuery.data?.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
