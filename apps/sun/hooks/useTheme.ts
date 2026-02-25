'use client'

import { useCallback, useEffect, useState } from 'react'

export type ThemeId = 'neutral' | 'green'

const STORAGE_KEY = 'theme'
const THEMES: ThemeId[] = ['neutral', 'green']

function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'neutral'
  const stored = localStorage.getItem(STORAGE_KEY)
  return THEMES.includes(stored as ThemeId) ? (stored as ThemeId) : 'neutral'
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme)

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'neutral' ? 'green' : 'neutral')
  }, [theme, setTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return { theme, setTheme, toggle } as const
}
