export function WhySection() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
            CONFIANZA ANAHI
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-primary)] sm:text-4xl">
            Por qué comprar en Anahi
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
            Trabajamos para que puedas abastecer tu mesa, salón o estudio con variedad, beneficios y atención cercana.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['🚚', 'Envios a todo el pais', 'Comprá desde donde estés y recibí tus insumos en tu ciudad.'],
            ['💬', 'Atencion personalizada', 'Te acompañamos para que puedas elegir mejor según tu trabajo.'],
            ['✨', 'Productos profesionales', 'Insumos seleccionados para manicuras y profesionales de belleza.'],
            ['🏷️', 'Beneficios todos los dias', 'Descuentos por método de pago y opciones pensadas para compras frecuentes.'],
          ].map(([icon, title, copy]) => (
            <article
              key={title}
              className="rounded-[24px] border border-[var(--color-border)] bg-white p-6 shadow-[0_14px_30px_rgba(17,24,39,0.05)]"
            >
              <div className="mb-5 text-3xl">{icon}</div>
              <h3 className="font-display text-xl font-semibold text-[var(--color-primary)]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
