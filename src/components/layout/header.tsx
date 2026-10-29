import { ChevronDown, ChevronLeft, ChevronRight, Menu, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { api } from '../../lib/api'
import { brandConfigs, storeSites } from '../../lib/constants'
import { buildStorePath, cn } from '../../lib/utils'
import { useCartStore } from '../../store/cart-store'
import type { ThemeMode } from '../../types'
import { ThemeToggle } from './theme-toggle'

type HeaderProps = {
  theme: ThemeMode
  onThemeChange: (value: ThemeMode) => void
}

export function Header({ theme, onThemeChange }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [mobileCategorySlug, setMobileCategorySlug] = useState('')
  const location = useLocation()
  const items = useCartStore((state) => state.items)
  const currentSite = storeSites.find((site) => location.pathname.startsWith(`/${site}`)) || 'anahinails'
  const brand = brandConfigs[currentSite]
  const categoriesQuery = useQuery({
    queryKey: ['categories', currentSite],
    queryFn: () => api.categories(currentSite),
  })
  const categories = categoriesQuery.data || []
  const mobileCategory = categories.find((category) => category.slug === mobileCategorySlug)
  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  )
  const navLinks = [
    { label: 'Inicio', to: buildStorePath(currentSite) },
    { label: 'Todos los productos', to: buildStorePath(currentSite, '/productos') },
    { label: 'Nuevos ingresos', to: `${buildStorePath(currentSite, '/productos')}?sort=newest` },
  ]
  const categoryPath = (category: string, subcategory?: string) => {
    const params = new URLSearchParams({ category })
    if (subcategory) params.set('subcategory', subcategory)
    return `${buildStorePath(currentSite, '/productos')}?${params.toString()}`
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-card)_90%,transparent)] shadow-[0_10px_30px_rgba(17,24,39,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-primary)] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <Link to={buildStorePath(currentSite)} className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-14 w-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] object-contain p-1 shadow-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold tracking-[0.03em] text-[var(--color-primary)]">
              {brand.name.toUpperCase()}
            </p>
            <p className="truncate text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">
              {brand.tagline}
            </p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface-card)_88%,transparent)] px-2 py-2 shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]',
                    isActive && 'btn-primary shadow-[0_10px_20px_rgba(17,24,39,0.14)]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            {categories.length > 0 ? (
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
                  Categorías
                  <ChevronDown size={15} className="transition group-open:rotate-180" />
                </summary>
                <div className="absolute left-0 top-full z-50 mt-3 grid w-[min(42rem,calc(100vw-3rem))] grid-cols-2 gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-3 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                  {categories.map((category) => (
                    <div key={category.id} className="rounded-2xl p-2 hover:bg-[var(--color-surface)]">
                      <Link
                        to={categoryPath(category.slug)}
                        className="block px-2 py-1 text-sm font-semibold text-[var(--color-primary)]"
                      >
                        {category.name}
                      </Link>
                      {category.subcategories.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1 px-2">
                          {category.subcategories.map((subcategory) => (
                            <Link
                              key={subcategory}
                              to={categoryPath(category.slug, subcategory)}
                              className="rounded-full px-2 py-1 text-xs text-[var(--color-muted)] transition hover:bg-[var(--color-surface-card)] hover:text-[var(--color-accent)]"
                            >
                              {subcategory}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle value={theme} onChange={onThemeChange} />
          <Link
            to="/bienvenida"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Beneficio de bienvenida
          </Link>
          <Link
            to={buildStorePath(currentSite, '/productos')}
            className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition"
          >
            {brand.productLabel}
          </Link>
        </div>

        <Link
          to="/carrito"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-card)] text-[var(--color-primary)] shadow-[0_10px_24px_rgba(17,24,39,0.07)]"
          aria-label="Carrito"
        >
          <ShoppingBag size={18} />
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[11px] font-bold text-white">
            {cartCount}
          </span>
        </Link>
      </div>

      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-4 lg:hidden">
          <div className="mt-4 flex flex-col gap-3 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
            <ThemeToggle value={theme} onChange={onThemeChange} mobile />
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-3 text-sm font-medium text-[var(--color-primary)]',
                    isActive && 'btn-primary',
                  )
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {categories.length > 0 ? (
              <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                {mobileCategory ? (
                  <>
                    <button type="button" onClick={() => setMobileCategorySlug('')} className="flex w-full items-center gap-2 border-b border-[var(--color-border)] px-2 py-3 text-left text-sm font-semibold text-[var(--color-primary)]"><ChevronLeft size={17} /> {mobileCategory.name}</button>
                    <div className="grid divide-y divide-[var(--color-border)]">
                      <Link to={categoryPath(mobileCategory.slug)} onClick={() => { setOpen(false); setMobileCategorySlug('') }} className="flex items-center justify-between px-2 py-4 text-sm font-semibold text-[var(--color-primary)]">Ver todo <ChevronRight size={17} /></Link>
                      {mobileCategory.subcategories.map((subcategory) => <Link key={subcategory} to={categoryPath(mobileCategory.slug, subcategory)} onClick={() => { setOpen(false); setMobileCategorySlug('') }} className="flex items-center justify-between px-2 py-4 text-sm text-[var(--color-primary)]">{subcategory}<ChevronRight size={17} /></Link>)}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Categorías</p>
                    <div className="grid divide-y divide-[var(--color-border)]">
                      {categories.map((category) => category.subcategories.length > 0 ? <button key={category.id} type="button" onClick={() => setMobileCategorySlug(category.slug)} className="flex items-center justify-between px-2 py-4 text-left text-sm font-semibold text-[var(--color-primary)]">{category.name}<ChevronRight size={17} /></button> : <Link key={category.id} to={categoryPath(category.slug)} onClick={() => setOpen(false)} className="flex items-center justify-between px-2 py-4 text-sm font-semibold text-[var(--color-primary)]">{category.name}<ChevronRight size={17} /></Link>)}
                    </div>
                  </>
                )}
              </div>
            ) : null}
            <Link
              to={buildStorePath(currentSite, '/productos')}
              className="btn-primary rounded-full px-4 py-3 text-center text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              {brand.productLabel}
            </Link>
            <Link
              to="/bienvenida"
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm font-medium text-[var(--color-primary)]"
              onClick={() => setOpen(false)}
            >
              Beneficio de bienvenida
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
