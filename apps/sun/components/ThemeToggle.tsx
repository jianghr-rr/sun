'use client'

import { useColorMode } from '../app/providers'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  const label = colorMode === 'light' ? '切换暗色' : '切换亮色'

  return (
    <button
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      onClick={toggleColorMode}
      type="button"
    >
      {label}
    </button>
  )
}

