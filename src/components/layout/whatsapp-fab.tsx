import { Boxes, MessageCircle, Package } from 'lucide-react'
import { useState } from 'react'
import { buildWhatsAppLink } from '../../lib/utils'

export function WhatsAppFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 w-[280px] overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-[0_20px_60px_rgba(17,24,39,0.14)]">
          <div className="flex items-center gap-3 bg-[#25d366] px-4 py-3 text-white">
            <MessageCircle size={18} />
            <span className="text-sm font-semibold">Anahi WhatsApp</span>
          </div>
          <div className="p-3">
            <a
              href={buildWhatsAppLink('Hola! Necesito atencion personalizada para comprar en Anahi Nails Diamond.')}
              target="_blank"
              rel="noreferrer"
              className="mb-2 flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-zinc-50"
            >
              <div className="rounded-full bg-zinc-100 p-2 text-zinc-700">
                <Package size={18} />
              </div>
              <span className="text-sm font-medium text-zinc-900">Atencion personalizada</span>
            </a>
            <a
              href={buildWhatsAppLink('Hola! Quiero consultar stock y hacer un pedido en Anahi Nails Diamond.')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-zinc-50"
            >
              <div className="rounded-full bg-zinc-100 p-2 text-zinc-700">
                <Boxes size={18} />
              </div>
              <span className="text-sm font-medium text-zinc-900">Consultas y pedidos</span>
            </a>
            <p className="px-3 pt-2 text-xs text-zinc-500">Selecciona un canal</p>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-3 text-left shadow-[0_18px_40px_rgba(17,24,39,0.14)]"
        aria-label="Abrir WhatsApp"
      >
        <div>
          <div className="text-xs font-semibold text-[var(--color-muted)]">Hace tu consulta</div>
          <div className="text-sm font-semibold text-zinc-900">Chatea por WhatsApp</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
          <MessageCircle size={22} />
        </div>
      </button>
    </div>
  )
}
