import { Camera, Globe2, MessageCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { brandConfigs, siteConfig, storeSites } from '../../lib/constants'
import { buildStorePath } from '../../lib/utils'

export function Footer() {
  const location = useLocation()
  const currentSite = storeSites.find((site) => location.pathname.startsWith(`/${site}`)) || 'anahinails'
  const brand = brandConfigs[currentSite]

  return (
    <footer className="border-t border-[var(--color-border)] bg-white text-[var(--color-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6">
        <img
          src={brand.logo}
          alt={`${brand.name} logo`}
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
        <p className="mb-1 text-sm text-[var(--color-muted)]">{brand.description}</p>
        <p className="text-sm text-[var(--color-muted)]">
          <a href={buildStorePath(currentSite)}>{brand.name}</a>
        </p>
        <div className="mx-auto mt-8 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-primary)]">
          {brand.name}
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-4 text-center text-sm text-[var(--color-muted)]">
        Copyright © {brand.name} 2026
      </div>
    </footer>
  )
}
