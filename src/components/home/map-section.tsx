import { MapPin } from 'lucide-react'

const address = 'Belgrano 225, Bahia Blanca 8000, Buenos Aires, Argentina'
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

export function MapSection() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr,1.15fr]">
        <article className="rounded-[30px] border border-[var(--color-border)] bg-white p-7 shadow-[0_18px_40px_rgba(17,24,39,0.05)] sm:p-8">
          <p className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            UBICACIÓN
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            Visitános en Bahía Blanca
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
            También podés acercarte al punto físico para consultas, coordinación de pedidos y atención personalizada.
          </p>

          <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-start gap-4">
              <div className="inline-flex rounded-2xl bg-[var(--color-accent-soft)] p-3 text-[var(--color-accent)]">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--color-primary)]">
                  Belgrano 225, Bahia Blanca 8000
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Buenos Aires, Argentina.
                </p>
              </div>
            </div>
          </div>
        </article>

        <div className="overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-white shadow-[0_18px_40px_rgba(17,24,39,0.05)]">
          <iframe
            title="Mapa de Anahi Nails Diamond"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[360px] w-full border-0 sm:h-[420px]"
          />
        </div>
      </div>
    </section>
  )
}
