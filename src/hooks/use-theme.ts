import { useEffect, useState } from 'react'
import type { ThemeMode } from '../types'

const STORAGE_KEY = 'theme-mode'

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'dark' ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.documentElement.dataset.theme = mode
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialThemeMode())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, setTheme }
}
