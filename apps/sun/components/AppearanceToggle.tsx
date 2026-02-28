'use client'

import { useRef, useState } from 'react'
import { AppearancePanel } from './AppearancePanel'

export function AppearanceToggle() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="icon-button shadow-card"
        aria-label={open ? '关闭外观设置' : '外观设置'}
        aria-expanded={open}
        title="外观设置"
      >
        <PaletteIcon />
      </button>

      <AppearancePanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={btnRef}
      />
    </div>
  )
}

function PaletteIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88a1.5 1.5 0 0 1 2.12 0l1.06 1.06a1.5 1.5 0 0 1 0 2.12l-2.88 2.88M10.5 8.197v-.322A1.875 1.875 0 0 0 8.625 6H8.25"
      />
    </svg>
  )
}
