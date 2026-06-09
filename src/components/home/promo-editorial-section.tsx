import { ArrowUpRight } from 'lucide-react'

export function PromoEditorialSection() {
  const toneCards = [
    {
      name: 'Cat Eye',
      detail: 'Brillo magnético y salida fuerte en sets premium.',
      accent: 'from-[#ffcabd] to-[#fff1eb]',
    },
    {
      name: 'Nude Rosado',
      detail: 'Base elegante para servicios delicados y comerciales.',
      accent: 'from-[#f4d7d9] to-[#fff5f6]',
    },
    {
      name: 'Cherry Glow',
      detail: 'Color protagonista para promos y nuevos ingresos.',
      accent: 'from-[#f07a7a] to-[#ffe5e5]',
    },
  ]

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <article className="relative overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[linear-gradient(135deg,#ffffff_0%,#fff8f3_44%,#ffe7dd_100%)] p-7 shadow-[0_20px_44px_rgba(17,24,39,0.06)] sm:p-8">
          <div className="absolute right-[-60px] top-[-56px] h-52 w-52 rounded-full bg-[var(--color-accent)]/12 blur-3xl" />
          <div className="absolute bottom-[-40px] left-[-30px] h-40 w-40 rounded-full bg-[#f9c9be]/30 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">
              Selección curada
            </p>
            <h2 className="font-display mt-4 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-0.03em] text-[var(--color-primary)] sm:text-[2.15rem]">
              Tonos, promos y categorías que empujan la compra apenas entran al sitio.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              Este bloque funciona como una vidriera: resalta familias de color, comunica movimiento comercial y ayuda a que la tienda se sienta más viva.
            </p>
          </div>

          <div className="relative mt-8 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="overflow-hidden rounded-[28px] border border-[rgba(17,24,39,0.06)] bg-[linear-gradient(135deg,#1f2937_0%,#374151_100%)] p-6 text-white shadow-[0_18px_38px_rgba(17,24,39,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85">
                    Tono en tendencia
                  </span>
                  <h3 className="font-display mt-4 text-3xl font-black tracking-[-0.03em]">Cat Eye + Nudes</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                    La mezcla que más ordena una vidriera comercial: brillo, tonos suaves y productos con alta salida.
                  </p>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 p-3 text-white/90">
                  <ArrowUpRight size={18} />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {['#d18f97', '#8f5f6b', '#f1d9d4', '#7f8898'].map((color) => (
                  <span
                    key={color}
                    className="h-12 w-12 rounded-full border border-white/20 shadow-[inset_0_1px_4px_rgba(255,255,255,0.35)]"
                    style={{ background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.9))` }}
                  />
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Nuevos ingresos', 'Rotación semanal'],
                  ['Promos activas', 'Mayor conversión'],
                  ['Compra asistida', 'WhatsApp rápido'],
                ].map(([title, subtitle]) => (
                  <div key={title} className="rounded-[20px] border border-white/12 bg-white/8 p-4">
                    <strong className="block text-sm font-semibold text-white">{title}</strong>
                    <span className="mt-2 block text-xs uppercase tracking-[0.14em] text-white/65">{subtitle}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {toneCards.map((tone) => (
                <article
                  key={tone.name}
                  className={`rounded-[24px] border border-[var(--color-border)] bg-gradient-to-br ${tone.accent} p-5 shadow-[0_14px_28px_rgba(17,24,39,0.05)]`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Paleta destacada
                  </span>
                  <h4 className="font-display mt-2 text-xl font-semibold text-[var(--color-primary)]">
                    {tone.name}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{tone.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
