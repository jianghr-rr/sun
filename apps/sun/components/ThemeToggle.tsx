'use client'

import { useTheme } from '../hooks/useTheme'

const THEME_META = {
  neutral: { label: '冷灰学术', next: '墨绿书卷' },
  green: { label: '墨绿书卷', next: '冷灰学术' },
} as const

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const meta = THEME_META[theme]

  return (
    <button
      onClick={toggle}
      className="icon-button shadow-card"
      aria-label={`当前: ${meta.label}，切换到${meta.next}`}
      title={`切换到${meta.next}`}
    >
      {theme === 'neutral' ? <NeutralIcon /> : <GreenIcon />}
    </button>
  )
}

function NeutralIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="4" strokeWidth={1.5} />
      <path strokeWidth={1.5} strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function GreenIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
    </svg>
  )
}
