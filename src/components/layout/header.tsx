import { Menu, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const items = useCartStore((state) => state.items)
  const currentSite = storeSites.find((site) => location.pathname.startsWith(`/${site}`)) || 'anahinails'
  const brand = brandConfigs[currentSite]
  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  )
  const navLinks = [
    { label: 'Inicio', to: buildStorePath(currentSite) },
    { label: 'Todos los productos', to: buildStorePath(currentSite, '/productos') },
    { label: 'Nuevos ingresos', to: `${buildStorePath(currentSite, '/productos')}?sort=newest` },
  ]

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
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle value={theme} onChange={onThemeChange} />
          <Link
            to="/admin"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Iniciar sesión
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
            <Link
              to={buildStorePath(currentSite, '/productos')}
              className="btn-primary rounded-full px-4 py-3 text-center text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              {brand.productLabel}
            </Link>
            <Link
              to="/admin"
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm font-medium text-[var(--color-primary)]"
              onClick={() => setOpen(false)}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
