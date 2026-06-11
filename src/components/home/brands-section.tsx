import { brandItems } from '../../lib/constants'

export function BrandsSection() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            MARCAS
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            Marcas que trabajamos
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
            Seleccionamos marcas profesionales para acompañar tu trabajo todos los días.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brandItems.map((brand) => (
            <div
              key={brand}
              className="group relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-card)] px-6 py-8 text-center text-lg font-semibold text-[var(--color-primary)] shadow-[0_14px_30px_rgba(17,24,39,0.04)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,244,239,0.86)),url('https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center opacity-95 transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.04),rgba(17,24,39,0.18))]" />
              <span className="relative font-display text-[var(--color-primary)] drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)]">
                {brand}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <strong className="font-display block text-lg font-semibold text-[var(--color-primary)]">
            Mas de 2.000 productos
          </strong>
          <span className="text-[var(--color-muted)]">para profesionales de belleza.</span>
        </div>
        <div className="mt-8 text-center">
          <a
            href="/productos"
            className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)]"
          >
            Ver productos
          </a>
        </div>
      </div>
    </section>
  )
}
