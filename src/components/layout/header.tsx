import { Menu, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navLinks } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { useCartStore } from '../../store/cart-store'

export function Header() {
  const [open, setOpen] = useState(false)
  const items = useCartStore((state) => state.items)
  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  )

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[rgba(255,250,248,0.94)] shadow-[0_10px_30px_rgba(17,24,39,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-primary)] lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
          <img
            src="/anahi-diamond-logo.png"
            alt="Anahi Nails Diamond"
            className="h-14 w-14 rounded-2xl border border-[var(--color-border)] bg-white object-contain p-1 shadow-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold tracking-[0.03em] text-[var(--color-primary)]">
              ANAHI NAILS DIAMOND
            </p>
            <p className="truncate text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">
              Beauty Supply
            </p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/80 px-2 py-2 shadow-[0_10px_24px_rgba(17,24,39,0.04)]">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]',
                  isActive && 'bg-[var(--color-primary)] !text-white shadow-[0_10px_20px_rgba(17,24,39,0.14)]',
                )
              }
            >
              Inicio
            </NavLink>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]',
                    isActive && 'bg-[var(--color-primary)] !text-white shadow-[0_10px_20px_rgba(17,24,39,0.14)]',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/admin"
            className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/productos"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold !text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition hover:bg-[var(--color-accent)]"
          >
            Ver tienda
          </Link>
        </div>

        <Link
          to="/carrito"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-[0_10px_24px_rgba(17,24,39,0.07)]"
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
          <div className="mt-4 flex flex-col gap-3 rounded-[28px] border border-[var(--color-border)] bg-white p-4 shadow-[0_12px_28px_rgba(17,24,39,0.05)]">
            <NavLink
              key="/"
              to="/"
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-3 text-sm font-medium text-[var(--color-primary)]',
                  isActive && 'bg-[var(--color-primary)] !text-white',
                )
              }
              onClick={() => setOpen(false)}
            >
              Inicio
            </NavLink>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-3 text-sm font-medium text-[var(--color-primary)]',
                    isActive && 'bg-[var(--color-primary)] !text-white',
                  )
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/productos"
              className="rounded-full bg-[var(--color-primary)] px-4 py-3 text-center text-sm font-semibold !text-white"
              onClick={() => setOpen(false)}
            >
              Ver tienda
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
