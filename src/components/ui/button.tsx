import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200',
        variant === 'primary' &&
          'bg-[var(--color-primary)] text-white shadow-[0_12px_30px_rgba(17,24,39,0.16)] hover:translate-y-[-1px]',
        variant === 'secondary' &&
          'border border-[var(--color-border)] bg-white text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        variant === 'ghost' &&
          'border border-[var(--color-border)] bg-transparent text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
