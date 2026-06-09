import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { startTransition, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/product-card'
import { ProductFilters } from '../components/catalog/product-filters'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'

export function CatalogPage() {
  useSEO({ title: 'Productos', description: 'Catalogo de esmaltes, nail art, herramientas y accesorios profesionales.' })
  const [searchParams, setSearchParams] = useSearchParams()
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'featured',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featuredOnly: searchParams.get('featured') === 'true',
  })

  const categoryQuery = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories,
  })

  const productQuery = useQuery({
    queryKey: ['products', searchParams.toString()],
    queryFn: () => api.products(searchParams),
  })

  const handleChange = (field: string, value: string | boolean) => {
    setLocalFilters((current) => ({ ...current, [field]: value }))
    startTransition(() => {
      const next = new URLSearchParams(searchParams)
      const mappedField = field === 'search' ? 'q' : field === 'featuredOnly' ? 'featured' : field
      if (value === '' || value === false) {
        next.delete(mappedField)
      } else {
        next.set(mappedField, String(value))
      }
      setSearchParams(next, { replace: true })
    })
  }

  const totalLabel = useMemo(() => {
    const count = productQuery.data?.length || 0
    return `${count} productos`
  }, [productQuery.data])

  return (
    <section className="bg-[#fff7f7] py-10">
      <div className="mx-auto max-w-[1680px] px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-[var(--color-primary)]">
            Todos los productos
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">{totalLabel}</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[340px,minmax(0,1fr)] xl:grid-cols-[390px,minmax(0,1fr)]">
          <div className="lg:sticky lg:top-28">
            <ProductFilters
              categories={categoryQuery.data || []}
              category={localFilters.category}
              sort={localFilters.sort}
              minPrice={localFilters.minPrice}
              maxPrice={localFilters.maxPrice}
              featuredOnly={localFilters.featuredOnly}
              onChange={handleChange}
            />
          </div>

          <div className="min-w-0">
            <label className="mb-5 flex items-center overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
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

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {productQuery.data?.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
