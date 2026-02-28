'use client'

import { useEffect, useRef } from 'react'
import { useAppearance } from '../hooks/useAppearance'
import { THEMES, FONTS, FONT_SIZES, READING_WIDTHS } from '../types/appearance'
import type { ThemeId, FontId } from '../types/appearance'

interface AppearancePanelProps {
  open: boolean
  onClose: () => void
  /** 锚点元素，用于定位面板 */
  anchorRef?: React.RefObject<HTMLElement | null>
}

const FONT_PREVIEW_CLASS: Record<FontId, string> = {
  'noto-serif': 'font-preview-noto-serif',
  'lxgw-wenkai': 'font-preview-lxgw-wenkai',
  'noto-sans': 'font-preview-noto-sans',
}

export function AppearancePanel({ open, onClose, anchorRef }: AppearancePanelProps) {
  const { theme, font, fontSize, readingWidth, setTheme, setFont, setFontSize, setReadingWidth } = useAppearance()
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击面板外部关闭
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  const currentSizeIdx = FONT_SIZES.findIndex((s) => s.id === fontSize)

  return (
    <>
      {/* 移动端遮罩 */}
      <div
        className="fixed inset-0 z-[59] bg-paper-950/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="外观设置"
        className={`
          fixed z-[60]
          max-lg:bottom-0 max-lg:left-0 max-lg:right-0
          max-lg:rounded-t-2xl max-lg:rounded-b-none
          max-lg:max-h-[80vh] max-lg:overflow-y-auto
          lg:absolute lg:top-full lg:left-0 lg:mt-2
          w-full lg:w-80
          reader-card shadow-card
          p-5
          animate-fade-in
        `}
      >
        {/* 移动端拖拽手柄 */}
        <div className="flex justify-center mb-3 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-paper-500/40" />
        </div>

        <h3 className="text-sm font-semibold text-paper-100 mb-4 tracking-wide">
          外观设置
        </h3>

        {/* 主题 */}
        <Section title="主题">
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((t) => (
              <ThemeButton
                key={t.id}
                themeId={t.id}
                label={t.label}
                active={theme === t.id}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
        </Section>

        {/* 字体 */}
        <Section title="字体">
          <div className="space-y-1">
            {FONTS.map((f) => (
              <FontButton
                key={f.id}
                fontId={f.id}
                label={f.label}
                category={f.category}
                active={font === f.id}
                onClick={() => setFont(f.id)}
              />
            ))}
          </div>
        </Section>

        {/* 字号 */}
        <Section title="字号">
          <div className="flex items-center gap-3">
            <span className="text-xs text-paper-400 shrink-0">A</span>
            <div className="flex-1 flex items-center gap-0">
              {FONT_SIZES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setFontSize(s.id)}
                  className={`
                    flex-1 py-1.5 text-xs text-center transition-all rounded
                    ${
                      fontSize === s.id
                        ? 'bg-accent-500/20 text-accent-300 font-medium'
                        : 'text-paper-400 hover:text-paper-200 hover:bg-paper-700/40'
                    }
                  `}
                  aria-label={`字号: ${s.label}`}
                  title={s.label}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <span className="text-base text-paper-400 shrink-0">A</span>
          </div>
        </Section>

        {/* 阅读宽度（仅桌面端显示） */}
        <Section title="阅读宽度" className="hidden lg:block">
          <div className="flex items-center gap-0">
            {READING_WIDTHS.map((w) => (
              <button
                key={w.id}
                onClick={() => setReadingWidth(w.id)}
                className={`
                  flex-1 py-1.5 text-xs text-center transition-all rounded
                  ${
                    readingWidth === w.id
                      ? 'bg-accent-500/20 text-accent-300 font-medium'
                      : 'text-paper-400 hover:text-paper-200 hover:bg-paper-700/40'
                  }
                `}
                aria-label={`阅读宽度: ${w.label}`}
                title={w.label}
              >
                {w.label}
              </button>
            ))}
          </div>
        </Section>

        {/* 预览 */}
        <div className="mt-4 pt-3 border-t border-paper-700/40">
          <p
            className={`text-paper-200 leading-relaxed ${FONT_PREVIEW_CLASS[font]}`}
            style={{
              fontSize: `${[15, 16, 18, 20, 22][currentSizeIdx]}px`,
              lineHeight: [1.9, 1.95, 2.0, 2.1, 2.2][currentSizeIdx],
            }}
          >
            天地英雄气，千秋尚凛然。
          </p>
        </div>
      </div>
    </>
  )
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 ${className ?? ''}`}>
      <div className="text-xs text-paper-400 mb-2 tracking-wider">{title}</div>
      {children}
    </div>
  )
}

function ThemeButton({
  themeId,
  label,
  active,
  onClick,
}: {
  themeId: ThemeId
  label: string
  active: boolean
  onClick: () => void
}) {
  const colors: Record<ThemeId, { from: string; to: string }> = {
    neutral: { from: '#262642', to: '#1c1c30' },
    green: { from: '#1a3a2b', to: '#122a1f' },
    warm: { from: '#faf7f0', to: '#ede6da' },
    blue: { from: '#f5f8fa', to: '#e4e9ee' },
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all
        ${active ? 'ring-1 ring-accent-500/50 bg-accent-500/10' : 'hover:bg-paper-700/40'}
      `}
      aria-pressed={active}
    >
      <div
        className="w-5 h-5 rounded-full border border-paper-500/30 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${colors[themeId].from}, ${colors[themeId].to})`,
        }}
      />
      <span className={`text-sm ${active ? 'text-accent-300' : 'text-paper-300'}`}>
        {label}
      </span>
    </button>
  )
}

function FontButton({
  fontId,
  label,
  category,
  active,
  onClick,
}: {
  fontId: FontId
  label: string
  category: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all
        ${active ? 'ring-1 ring-accent-500/50 bg-accent-500/10' : 'hover:bg-paper-700/40'}
      `}
      aria-pressed={active}
    >
      <span
        className={`text-sm ${FONT_PREVIEW_CLASS[fontId]} ${active ? 'text-accent-300' : 'text-paper-300'}`}
      >
        {label}
      </span>
      <span className="text-xs text-paper-500">{category}</span>
    </button>
  )
}
