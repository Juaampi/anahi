import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SmartImage } from '../components/ui/smart-image'
import { useSEO } from '../hooks/use-seo'
import { getProductFallbackImage } from '../lib/constants'
import { formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cart-store'

export function CartPage() {
  useSEO({ title: 'Carrito' })
  const { items, removeItem, updateQuantity } = useCartStore()
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0)

  return (
    <section className="bg-transparent py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Carrito</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold tracking-[-0.03em] text-[var(--color-primary)]">
            Tus productos seleccionados
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <div>
            {items.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-[var(--color-border)] bg-white p-10 text-center text-[var(--color-muted)]">
                Todavia no agregaste productos.{' '}
                <Link to="/productos" className="font-semibold text-[var(--color-primary)]">
                  Ir al catalogo
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4 md:hidden">
                  {items.map((item) => (
                    <article
                      key={item.product.id}
                      className="rounded-[2rem] border border-[var(--color-border)] bg-white p-4 shadow-[0_14px_30px_rgba(17,24,39,0.05)]"
                    >
                      <div className="flex items-start gap-4">
                        <SmartImage
                          src={item.product.imageUrls[0]}
                          fallbackSrc={getProductFallbackImage(item.product.categoryName, item.product.name)}
                          alt={item.product.name}
                          className="h-20 w-20 rounded-[18px] bg-[#faf7f5] object-contain p-2"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                            {item.product.categoryName}
                          </p>
                          <h2 className="font-display mt-2 text-base font-bold leading-6 text-[var(--color-primary)]">
                            {item.product.name}
                          </h2>
                          <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
                            {formatCurrency(item.product.price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 rounded-[1.5rem] bg-[#fffaf8] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--color-muted)]">Cantidad</span>
                          <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-3 py-2 text-[var(--color-primary)]"
                              aria-label={`Disminuir cantidad de ${item.product.name}`}
                            >
                              <Minus size={15} />
                            </button>
                            <span className="min-w-10 text-center text-sm font-semibold text-[var(--color-primary)]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-3 py-2 text-[var(--color-primary)]"
                              aria-label={`Aumentar cantidad de ${item.product.name}`}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--color-muted)]">Subtotal</span>
                          <span className="font-display text-lg font-bold text-[var(--color-primary)]">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          <Trash2 size={15} />
                          Borrar del carrito
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white shadow-[0_14px_30px_rgba(17,24,39,0.05)] md:block">
                  <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="border-b border-[var(--color-border)] bg-[#fff8f6]">
                      <tr className="text-left">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Producto
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Precio
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Cantidad
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Subtotal
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.product.id} className="border-b border-[var(--color-border)] last:border-b-0">
                          <td className="px-6 py-5">
                            <div className="flex min-w-[260px] items-center gap-4">
                              <SmartImage
                                src={item.product.imageUrls[0]}
                                fallbackSrc={getProductFallbackImage(item.product.categoryName, item.product.name)}
                                alt={item.product.name}
                                className="h-20 w-20 rounded-[18px] bg-[#faf7f5] object-contain p-2"
                              />
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                                  {item.product.categoryName}
                                </p>
                                <h2 className="font-display mt-2 text-base font-bold leading-6 text-[var(--color-primary)]">
                                  {item.product.name}
                                </h2>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <span className="font-semibold text-[var(--color-primary)]">
                              {formatCurrency(item.product.price)}
                            </span>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[#fffaf8]">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="px-3 py-2 text-[var(--color-primary)]"
                                aria-label={`Disminuir cantidad de ${item.product.name}`}
                              >
                                <Minus size={15} />
                              </button>
                              <span className="min-w-10 text-center text-sm font-semibold text-[var(--color-primary)]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="px-3 py-2 text-[var(--color-primary)]"
                                aria-label={`Aumentar cantidad de ${item.product.name}`}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <span className="font-display text-lg font-bold text-[var(--color-primary)]">
                              {formatCurrency(item.product.price * item.quantity)}
                            </span>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 size={15} />
                              Borrar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </>
            )}
          </div>

          <aside className="h-fit rounded-[2rem] border border-[var(--color-border)] bg-white p-6 shadow-[0_14px_30px_rgba(17,24,39,0.05)]">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-muted)]">Resumen</p>
            <div className="mt-6 space-y-4 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <strong className="text-[var(--color-primary)]">{formatCurrency(subtotal)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Envio</span>
                <span>Se calcula al finalizar</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-4">
                <div className="flex items-center justify-between">
                  <span>Total</span>
                  <strong className="font-display text-xl text-[var(--color-primary)]">
                    {formatCurrency(subtotal)}
                  </strong>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-4 text-sm font-semibold"
            >
              Finalizar compra
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
