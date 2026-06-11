import { Link } from 'react-router-dom'
import { siteConfig } from '../../lib/constants'

export function HeroSection() {
  return (
    <section className="px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-white shadow-[0_24px_60px_rgba(17,24,39,0.06)]">
        <div className="relative min-h-[560px]">
          <img
            src={siteConfig.heroImage}
            alt="Anahi Nails Diamond - Insumos profesionales para belleza"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.68)_0%,rgba(17,24,39,0.28)_36%,rgba(255,255,255,0.02)_100%)]" />
          <div className="relative flex min-h-[560px] items-end px-6 py-8 sm:px-10 lg:px-14 lg:py-14">
            <div className="max-w-[520px] rounded-[28px] bg-white/94 p-6 shadow-[0_24px_60px_rgba(17,24,39,0.16)] backdrop-blur sm:p-8">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-18 w-18 items-center justify-center rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                  <img
                    src="/anahi-diamond-logo.png"
                    alt="Isologo Anahi Nails Diamond"
                    className="h-14 w-14 object-contain"
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
                  ANAHI NAILS DIAMOND
                </span>
              </div>
              <h1 className="font-display mt-3 text-4xl font-black leading-[0.98] tracking-[-0.03em] text-[var(--color-primary)] sm:text-5xl">
                Insumos profesionales
              </h1>
              <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                Encontrá productos para tu mesa de trabajo, salón o estudio, con envíos a todo el país y beneficios todos los días.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/productos"
                  className="btn-primary inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-semibold shadow-[0_14px_30px_rgba(17,24,39,0.14)]"
                >
                  Comprar productos
                </Link>
                <a
                  href="#kx-categorias"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Ver categorías
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
