import { Camera, Globe2, MessageCircle } from 'lucide-react'
import { siteConfig } from '../../lib/constants'

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white text-[var(--color-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6">
        <img
          src="/anahi-diamond-logo.png"
          alt="Anahi Nails Diamond logo"
          className="mx-auto mb-8 h-24 w-24 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] object-contain p-3"
        />
        <div className="mb-6 flex items-center justify-center gap-3 text-[var(--color-muted)]">
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <Camera size={16} />
          </a>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <MessageCircle size={16} />
          </a>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <Globe2 size={16} />
          </a>
        </div>
        <p className="mb-1 text-sm text-[var(--color-muted)]">Belgrano 225, Bahia Blanca 8000</p>
        <p className="text-sm text-[var(--color-muted)]">Buenos Aires, Argentina.</p>
        <div className="mx-auto mt-8 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)]">
          {siteConfig.name}
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-4 text-center text-sm text-[var(--color-muted)]">
        Copyright © {siteConfig.name} 2026
      </div>
    </footer>
  )
}
