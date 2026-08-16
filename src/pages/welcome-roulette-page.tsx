import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useSEO } from '../hooks/use-seo'

export function WelcomeRoulettePage() {
  useSEO({ title: 'Ruleta de bienvenida' })
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [token, setToken] = useState(() => localStorage.getItem('customer-token') || '')
  const [prize, setPrize] = useState<{ code: string; value: number } | null>(null)
  const register = useMutation({ mutationFn: () => api.registerCustomer(form.name, form.email, form.password), onSuccess: (result) => { localStorage.setItem('customer-token', result.token); setToken(result.token) } })
  const spin = useMutation({ mutationFn: () => api.spinRoulette(token), onSuccess: (result) => setPrize(result) })
  const error = register.error || spin.error

  return <section className="py-14"><div className="mx-auto max-w-xl px-4 sm:px-6">
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-white p-7 text-center shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Beneficio de bienvenida</p>
      <h1 className="mt-3 font-display text-4xl font-black text-[var(--color-primary)]">Gir&aacute; y descubrí tu descuento</h1>
      {!token ? <form className="mt-7 grid gap-3 text-left" onSubmit={(e) => { e.preventDefault(); register.mutate() }}>
        <input required placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl border border-[var(--color-border)] p-3" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-2xl border border-[var(--color-border)] p-3" />
        <input required minLength={8} type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-2xl border border-[var(--color-border)] p-3" />
        <button className="btn-primary rounded-full px-5 py-3 font-semibold">{register.isPending ? 'Creando...' : 'Crear cuenta y girar'}</button>
      </form> : prize ? <div className="mt-8 rounded-[1.5rem] bg-emerald-50 p-6 text-emerald-800"><p className="text-5xl font-black">{prize.value}% OFF</p><p className="mt-3">Tu código: <strong className="select-all">{prize.code}</strong></p><Link to="/checkout" className="btn-primary mt-5 inline-block rounded-full px-5 py-3">Usar en checkout</Link></div> : <div className="mt-8"><div className="mx-auto grid h-56 w-56 place-items-center rounded-full border-[14px] border-[var(--color-accent)] bg-[conic-gradient(#fbd5e4_0_25%,#fde68a_25%_50%,#bfdbfe_50%_75%,#bbf7d0_75%)] text-2xl font-black text-[var(--color-primary)]">¡Suerte!</div><button onClick={() => spin.mutate()} disabled={spin.isPending} className="btn-primary mt-7 rounded-full px-7 py-4 font-semibold">{spin.isPending ? 'Girando...' : 'Girar una vez'}</button></div>}
      {error ? <p className="mt-4 text-sm text-rose-600">{error instanceof Error ? error.message : 'No se pudo continuar.'}</p> : null}
      {token && !prize ? <button onClick={() => navigate('/anahinails')} className="mt-4 text-sm text-[var(--color-muted)]">Volver a la tienda</button> : null}
    </div></div></section>
}
