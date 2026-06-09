import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSEO } from '../hooks/use-seo'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cart-store'

export function CheckoutPage() {
  useSEO({ title: 'Checkout' })
  const { items, clearCart } = useCartStore()
  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
    sendWhatsAppSummary: true,
  })
  const [orderFeedback, setOrderFeedback] = useState('')
  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items],
  )

  const payload = {
    ...form,
    items: items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
    })),
  }

  const orderMutation = useMutation({
    mutationFn: () => api.createOrder(payload),
    onSuccess: (result) => {
      setOrderFeedback(`Pedido ${result.order.orderNumber} generado correctamente.`)
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer')
      }
    },
  })

  const preferenceMutation = useMutation({
    mutationFn: () => api.createPreference(payload),
    onSuccess: (result) => {
      if (result.initPoint || result.sandboxInitPoint) {
        clearCart()
        window.location.href = result.initPoint || result.sandboxInitPoint || '/gracias'
      } else {
        setOrderFeedback('Preferencia generada. Configura el access token de Mercado Pago para redirigir al checkout.')
      }
    },
  })

  return (
    <section className="bg-transparent py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Checkout</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.03em] text-[var(--color-primary)]">
            Finalizar compra
          </h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
          <form
            className="rounded-[2rem] border border-[var(--color-border)] bg-white p-6 text-[var(--color-primary)] shadow-[0_14px_30px_rgba(17,24,39,0.05)]"
            onSubmit={(event) => {
              event.preventDefault()
              orderMutation.mutate()
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['customerName', 'Nombre completo'],
                ['email', 'Email'],
                ['phone', 'Telefono'],
                ['address', 'Direccion'],
                ['city', 'Ciudad'],
                ['province', 'Provincia'],
                ['postalCode', 'Codigo postal'],
              ].map(([key, label]) => (
                <label key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
                  <span className="mb-2 block text-sm font-medium text-[var(--color-primary)]">{label}</span>
                  <input
                    required
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-primary)] outline-none"
                  />
                </label>
              ))}
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Notas del pedido</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-28 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-primary)] outline-none"
                />
              </label>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-[var(--color-muted)]">
              <input
                type="checkbox"
                checked={form.sendWhatsAppSummary}
                onChange={(event) => setForm((current) => ({ ...current, sendWhatsAppSummary: event.target.checked }))}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Enviar resumen del pedido por WhatsApp
            </label>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={orderMutation.isPending || items.length === 0}
                className="inline-flex justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm font-semibold text-[var(--color-primary)]"
              >
                Guardar pedido
              </button>
              <button
                type="button"
                disabled={preferenceMutation.isPending || items.length === 0}
                onClick={() => preferenceMutation.mutate()}
                className="inline-flex justify-center rounded-full bg-[var(--color-primary)] px-5 py-4 text-sm font-semibold !text-white"
              >
                Pagar con Mercado Pago
              </button>
            </div>
            {orderFeedback ? <p className="mt-5 text-sm text-[var(--color-muted)]">{orderFeedback}</p> : null}
          </form>
          <aside className="h-fit rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_14px_30px_rgba(17,24,39,0.05)]">
            <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">Resumen del pedido</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between font-display text-lg font-semibold text-[var(--color-primary)]">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
