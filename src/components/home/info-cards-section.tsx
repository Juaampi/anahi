import { Gem, ShieldCheck, Sparkles, Truck } from 'lucide-react'

const featureCards = [
  {
    icon: Sparkles,
    title: 'Tonos en tendencia',
    copy: 'Semipermanentes, cat eye y colecciones que hoy más se piden en mesa de trabajo y salón.',
  },
  {
    icon: Truck,
    title: 'Envios simples',
    copy: 'Comprá online, resolvé dudas rápidas y prepará pedidos sin fricción.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra segura',
    copy: 'Precios claros, cuotas visibles y flujo pensado para convertir mejor.',
  },
  {
    icon: Gem,
    title: 'Imagen premium',
    copy: 'Una tienda con más presencia para vender insumos con mejor percepción.',
  },
]

export function InfoCardsSection() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            INFORMACIÓN CLAVE
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            Beneficios para comprar mejor
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="aspect-square rounded-[28px] border border-[var(--color-border)] bg-white p-6 text-[var(--color-primary)] shadow-[0_18px_40px_rgba(17,24,39,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(17,24,39,0.08)]"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-[var(--color-accent-soft)] p-3 text-[var(--color-accent)]">
                <Icon size={22} />
              </div>
              <h3 className="font-display text-xl font-bold leading-6">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
