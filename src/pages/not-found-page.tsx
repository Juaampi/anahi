import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">404</p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-950">Pagina no encontrada</h1>
      <Link to="/" className="mt-6 rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white">
        Volver al inicio
      </Link>
    </section>
  )
}
