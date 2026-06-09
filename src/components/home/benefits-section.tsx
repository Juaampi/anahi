export function BenefitsSection() {
  return (
    <section className="px-4 py-6 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['15% OFF', 'en efectivo'],
          ['5% OFF', 'por transferencia'],
          ['3 cuotas', 'sin interés'],
          ['Envios', 'a todo el país'],
        ].map(([title, subtitle]) => (
          <article key={title} className="bg-white px-5 py-5 text-center">
            <strong className="font-display block text-lg font-semibold text-[var(--color-primary)]">{title}</strong>
            <span className="text-sm text-[var(--color-muted)]">{subtitle}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
