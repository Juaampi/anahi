import { formatCurrency } from '../../lib/utils'

export function PaymentSimulator({ price }: { price: number }) {
  const cashPrice = price * 0.85
  const transferPrice = price * 0.95
  const installmentPrice = price / 3

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-white p-5 text-[var(--color-primary)] shadow-[0_18px_40px_rgba(17,24,39,0.05)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        Formas de pago
      </p>
      <h2 className="font-display mt-2 text-xl font-semibold">Calculá tu precio según la forma de pago</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="relative overflow-hidden rounded-[24px] border border-[rgba(240,93,67,0.28)] bg-[linear-gradient(180deg,rgba(240,93,67,0.16),rgba(240,93,67,0.04))] p-4">
          <div className="absolute inset-y-0 left-[-120px] w-24 rotate-[20deg] bg-white/15 blur-sm" />
          <p className="text-sm font-semibold text-[var(--color-primary)]">Efectivo</p>
          <strong className="mt-3 block font-display text-2xl font-semibold text-[var(--color-primary)]">
            {formatCurrency(cashPrice)}
          </strong>
          <span className="mt-2 block text-sm text-[var(--color-muted)]">15% de descuento</span>
        </article>
        <article className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">Transferencia</p>
          <strong className="mt-3 block font-display text-2xl font-semibold text-[var(--color-primary)]">
            {formatCurrency(transferPrice)}
          </strong>
          <span className="mt-2 block text-sm text-[var(--color-muted)]">5% de descuento</span>
        </article>
        <article className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-primary)]">3 cuotas</p>
          <strong className="mt-3 block font-display text-2xl font-semibold text-[var(--color-primary)]">
            3 x {formatCurrency(installmentPrice)}
          </strong>
          <span className="mt-2 block text-sm text-[var(--color-muted)]">Sin interés</span>
        </article>
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        El descuento se aplica según el medio de pago elegido al finalizar la compra.
      </p>
    </section>
  )
}
