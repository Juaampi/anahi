import { Moon, Sun } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ThemeMode } from '../../types'

const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

type ThemeToggleProps = {
  value: ThemeMode
  onChange: (value: ThemeMode) => void
  mobile?: boolean
}

export function ThemeToggle({ value, onChange, mobile = false }: ThemeToggleProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-card)] p-1 shadow-[0_10px_24px_rgba(17,24,39,0.06)]',
        mobile && 'w-full justify-between rounded-[28px] px-2 py-2',
      )}
    >
      {options.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--color-muted)] transition',
              mobile && 'flex-1',
              value === option.value && 'btn-primary',
            )}
            aria-pressed={value === option.value}
            title={`Tema ${option.label.toLowerCase()}`}
          >
            <Icon size={15} />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
