import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildWhatsAppLink(message: string) {
  const base = 'https://wa.me/'
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '5490000000000'
  return `${base}${number}?text=${encodeURIComponent(message)}`
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase()
}
