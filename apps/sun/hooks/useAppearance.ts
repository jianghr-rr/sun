'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeId, FontId, FontSizeId, ReadingWidthId, AppearanceState } from '../types/appearance'
import { APPEARANCE_DEFAULTS, THEMES, FONTS, FONT_SIZES, READING_WIDTHS } from '../types/appearance'

const STORAGE_KEY = 'appearance'
const LEGACY_THEME_KEY = 'theme'

function isValidTheme(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v)
}

function isValidFont(v: unknown): v is FontId {
  return FONTS.some((f) => f.id === v)
}

function isValidFontSize(v: unknown): v is FontSizeId {
  return FONT_SIZES.some((s) => s.id === v)
}

function isValidReadingWidth(v: unknown): v is ReadingWidthId {
  return READING_WIDTHS.some((w) => w.id === v)
}

function applyToDOM(state: AppearanceState) {
  const el = document.documentElement
  el.setAttribute('data-theme', state.theme)
  el.setAttribute('data-font', state.font)
  el.setAttribute('data-font-size', state.fontSize)
  el.setAttribute('data-reading-width', state.readingWidth)
}

function loadStored(): AppearanceState {
  if (typeof window === 'undefined') return APPEARANCE_DEFAULTS

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        theme: isValidTheme(parsed.theme) ? parsed.theme : APPEARANCE_DEFAULTS.theme,
        font: isValidFont(parsed.font) ? parsed.font : APPEARANCE_DEFAULTS.font,
        fontSize: isValidFontSize(parsed.fontSize) ? parsed.fontSize : APPEARANCE_DEFAULTS.fontSize,
        readingWidth: isValidReadingWidth(parsed.readingWidth) ? parsed.readingWidth : APPEARANCE_DEFAULTS.readingWidth,
      }
    }

    // 迁移旧版 theme 存储
    const legacy = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy && isValidTheme(legacy)) {
      const migrated: AppearanceState = { ...APPEARANCE_DEFAULTS, theme: legacy }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_THEME_KEY)
      return migrated
    }
  } catch {
    // ignore
  }

  return APPEARANCE_DEFAULTS
}

function persist(state: AppearanceState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useAppearance() {
  const [state, setState] = useState<AppearanceState>(loadStored)

  const update = useCallback((patch: Partial<AppearanceState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch }
      persist(next)
      applyToDOM(next)
      return next
    })
  }, [])

  const setTheme = useCallback((theme: ThemeId) => update({ theme }), [update])
  const setFont = useCallback((font: FontId) => update({ font }), [update])
  const setFontSize = useCallback((fontSize: FontSizeId) => update({ fontSize }), [update])
  const setReadingWidth = useCallback((readingWidth: ReadingWidthId) => update({ readingWidth }), [update])

  // 首次挂载时同步 DOM
  useEffect(() => {
    applyToDOM(state)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    theme: state.theme,
    font: state.font,
    fontSize: state.fontSize,
    readingWidth: state.readingWidth,
    setTheme,
    setFont,
    setFontSize,
    setReadingWidth,
  } as const
}
