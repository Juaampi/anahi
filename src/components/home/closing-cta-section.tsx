import { Link } from 'react-router-dom'

export function ClosingCtaSection() {
  return (
    <section className="px-4 pb-20 pt-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[30px] border border-[var(--color-border)] bg-[linear-gradient(135deg,#ffffff_0%,#fff6f2_50%,#ffe6dc_100%)] px-6 py-12 text-center text-[var(--color-primary)] shadow-[0_20px_40px_rgba(17,24,39,0.05)] sm:px-10">
          <p className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            ANAHI NAILS DIAMOND
          </p>
          <h2 className="font-display mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-[-0.03em]">
            Comprá insumos profesionales para tu trabajo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Explorá el catálogo completo y encontrá productos para manicuría, pestañas, maquillaje y estética.
          </p>
          <div className="mt-8">
            <Link
              to="/productos"
              className="btn-primary inline-flex rounded-full px-6 py-4 text-sm font-semibold"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
