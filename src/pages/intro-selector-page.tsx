import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brandConfigs } from '../lib/constants'
import { buildStorePath } from '../lib/utils'

export function IntroSelectorPage() {
  const nails = brandConfigs.anahinails
  const spirit = brandConfigs.wildspirit

  return (
    <section className="min-h-[calc(100vh-120px)] bg-[radial-gradient(circle_at_top_left,rgba(217,111,154,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(13,107,125,0.12),transparent_32%),linear-gradient(180deg,#fffdfd_0%,#fff6f8_42%,#f8fdff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-muted)]">Elegí tu universo</p>
          <h1 className="mt-4 font-display text-5xl font-black tracking-[-0.05em] text-[var(--color-primary)] sm:text-6xl">
            Dos marcas. Dos energías. Una sola experiencia bien cuidada.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--color-muted)] sm:text-lg">
            Entrá a la tienda que quieras trabajar hoy: belleza profesional con Anahi o diseño a pedido con Wild Spirit.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Link
            to={buildStorePath('anahinails')}
            className="group overflow-hidden rounded-[40px] border border-white/60 bg-white p-6 shadow-[0_30px_80px_rgba(217,111,154,0.14)] transition hover:-translate-y-1"
          >
            <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#fff6fb_0%,#ffe9f2_55%,#ffffff_100%)] p-8">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),transparent_60%)]" />
              <div className="relative flex min-h-[420px] flex-col justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#b84778]">
                    Beauty Supply
                  </span>
                  <h2 className="mt-6 font-display text-4xl font-black tracking-[-0.05em] text-[#6a2144]">
                    {nails.name}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-[#8d5570]">
                    Insumos, color, herramientas y compra ágil para profesionales que quieren una tienda prolija, premium y lista para convertir.
                  </p>
                </div>
                <div className="relative mt-8 flex items-end justify-between gap-4">
                  <img
                    src={nails.logo}
                    alt={nails.name}
                    className="h-44 w-44 rounded-[28px] border border-white/70 bg-white/70 object-contain p-4 shadow-[0_24px_60px_rgba(217,111,154,0.18)]"
                  />
                  <span className="inline-flex items-center gap-3 rounded-full bg-[#6a2144] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(106,33,68,0.24)]">
                    Entrar a Anahi
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to={buildStorePath('wildspirit')}
            className="group overflow-hidden rounded-[40px] border border-white/60 bg-white p-6 shadow-[0_30px_80px_rgba(13,107,125,0.14)] transition hover:-translate-y-1"
          >
            <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#f8feff_0%,#eefcff_55%,#ffffff_100%)] p-8">
              <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_right,rgba(37,211,178,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,126,48,0.14),transparent_24%)]" />
              <div className="relative flex min-h-[420px] flex-col justify-between">
                <div>
                  <span className="inline-flex rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#0d6b7d]">
                    Diseño a pedido
                  </span>
                  <h2 className="mt-6 font-display text-4xl font-black tracking-[-0.05em] text-[#0e3240]">
                    {spirit.name}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-[#476873]">
                    Vestí tu esencia. No la de todos. Hacemos buzos y remeras a pedido, con diseños exclusivos, cero stock y calidad premium de punta a punta.
                  </p>
                </div>
                <div className="relative mt-8 flex items-end justify-between gap-4">
                  <img
                    src={spirit.logo}
                    alt={spirit.name}
                    className="h-44 w-44 rounded-[28px] border border-white/70 bg-white/80 object-cover p-2 shadow-[0_24px_60px_rgba(13,107,125,0.18)]"
                  />
                  <span className="inline-flex items-center gap-3 rounded-full bg-[#0d6b7d] px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(13,107,125,0.22)]">
                    Entrar a Wild Spirit
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
