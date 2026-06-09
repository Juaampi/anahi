import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useSEO } from '../hooks/use-seo'

export function AdminLoginPage() {
  useSEO({ title: 'Admin' })
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@anahinailsdiamond.com')
  const [password, setPassword] = useState('admin123456')

  const mutation = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: ({ token }) => {
      localStorage.setItem('admin-token', token)
      navigate('/admin/dashboard')
    },
  })

  return (
    <section className="bg-black py-20 text-white">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Panel administrador</p>
          <h1 className="mt-3 text-3xl font-semibold">Ingresar</h1>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.mutate()
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-white/70">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none" />
            </label>
            <button className="w-full rounded-full bg-[var(--color-primary)] px-5 py-4 text-sm font-semibold text-white">
              {mutation.isPending ? 'Ingresando...' : 'Entrar al panel'}
            </button>
            {mutation.isError ? <p className="text-sm text-rose-300">No se pudo iniciar sesion.</p> : null}
          </form>
        </div>
      </div>
    </section>
  )
}
