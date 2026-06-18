import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/catalog/product-card'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'
import { brandConfigs } from '../lib/constants'
import { fallbackCategories, fallbackProducts } from '../lib/fallback-data'
import { buildStorePath } from '../lib/utils'
import type { StoreSite } from '../types'

export function BrandHomePage({ site }: { site: StoreSite }) {
  const brand = brandConfigs[site]
  useSEO({ title: brand.name, description: brand.description })

  const { data } = useQuery({
    queryKey: ['storefront', site],
    queryFn: () => api.storefront(site),
    retry: false,
  })

  const storefront = data || {
    categories: fallbackCategories.filter((item) => item.site === site),
    featuredProducts: fallbackProducts.filter((item) => item.site === site && item.featured).slice(0, 4),
    bestSellers: fallbackProducts.filter((item) => item.site === site && item.badges.includes('best-seller')).slice(0, 4),
    newArrivals: fallbackProducts.filter((item) => item.site === site && item.badges.includes('new')).slice(0, 4),
  }

  return (
    <section className="bg-[linear-gradient(180deg,#fffefe_0%,#fff9fb_32%,#fbfeff_100%)] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-8 rounded-[40px] border border-white/70 bg-white/80 p-6 shadow-[0_28px_80px_rgba(17,24,39,0.08)] lg:grid-cols-[1.05fr,0.95fr] lg:p-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-primary)]">
              <Sparkles size={14} />
              {brand.tagline}
            </span>
            <h1 className="mt-6 font-display text-5xl font-black tracking-[-0.05em] text-[var(--color-primary)] sm:text-6xl">
              {brand.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-muted)] sm:text-lg">
              {site === 'wildspirit'
                ? 'Vestí tu esencia. No la de todos. Hacemos buzos y remeras a pedido, con diseños exclusivos que nadie más va a tener. Cero stock, cero reventa. Solo lo que vos querés, como lo querés.'
                : 'Todo para tu mesa de trabajo, tu salón o tu estudio: categorías claras, compra rápida y una estética premium pensada para vender mejor.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={buildStorePath(site, '/productos')}
                className="btn-primary inline-flex items-center gap-3 rounded-full px-6 py-4 text-sm font-semibold"
              >
                {brand.productLabel}
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white px-6 py-4 text-sm font-semibold text-[var(--color-primary)]"
              >
                Cambiar de marca
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[36px] border border-[var(--color-border)] bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_100%)] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,107,125,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(217,111,154,0.12),transparent_30%)]" />
            <div className="relative">
              <img
                src={brand.heroImage}
                alt={brand.name}
                className={`mx-auto w-full ${site === 'wildspirit' ? 'max-w-[420px] object-cover' : 'max-w-[360px] object-contain'} rounded-[28px]`}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {storefront.categories.map((category) => (
            <Link
              key={category.id}
              to={`${buildStorePath(site, '/productos')}?category=${category.slug}`}
              className="rounded-[28px] border border-[var(--color-border)] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)] transition hover:-translate-y-1"
            >
              <img
                src={category.imageUrl || brand.logo}
                alt={category.name}
                className="h-28 w-full rounded-[22px] bg-[var(--color-surface)] object-contain p-3"
              />
              <h2 className="mt-4 font-display text-2xl font-bold text-[var(--color-primary)]">{category.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">{category.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">Destacados</p>
              <h2 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] text-[var(--color-primary)]">
                {site === 'wildspirit' ? 'Lo más pedido' : 'Lo más elegido por profesionales'}
              </h2>
            </div>
            <Link to={buildStorePath(site, '/productos')} className="text-sm font-semibold text-[var(--color-primary)]">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {storefront.featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
