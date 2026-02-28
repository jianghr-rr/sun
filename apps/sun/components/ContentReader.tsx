'use client'

/**
 * 正文阅读区组件
 * 显示节点标题、时间、正文内容，以及上一节/下一节导航
 * 地名标签可点击，触发地图聚焦
 */

import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import type { Node, Place } from '../types/narrative'
import { MdxRenderer } from './MdxRenderer'

interface PlaceTag {
  id: string
  name: string
  label: string
}

interface ContentReaderProps {
  node: Node | null
  places: Place[]
  isLoading?: boolean
  error?: string | null
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  highlightedPlaceId?: string | null
  onPlaceClick?: (placeId: string) => void
  onPlaceHover?: (placeId: string | null) => void
  /** 正文滚动进度 0~1 */
  onScrollProgress?: (ratio: number) => void
  /** 恢复阅读位置用的滚动比例 0~1 */
  initialScrollRatio?: number
  /** 当恢复流程完成后回调（用于上层解除“恢复阶段禁写”） */
  onRestoreDone?: () => void
}

export function ContentReader({
  node,
  places,
  isLoading,
  error,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  highlightedPlaceId,
  onPlaceClick,
  onPlaceHover,
  onScrollProgress,
  initialScrollRatio,
  onRestoreDone,
}: ContentReaderProps) {
  // 阅读进度
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [readProgress, setReadProgress] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    const max = scrollHeight - clientHeight
    const ratio = max > 0 ? Math.min(scrollTop / max, 1) : 0
    setReadProgress(ratio)
    onScrollProgress?.(ratio)
  }, [onScrollProgress])

  // 节点切换时，默认滚动到顶部（除非有恢复比例）
  useEffect(() => {
    if (!node?.id) return
    if (initialScrollRatio != null && initialScrollRatio > 0) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = 0
    setReadProgress(0)
  }, [node?.id, initialScrollRatio])

  // 恢复阅读位置（双 raf + 一次性 ResizeObserver 补偿）
  useEffect(() => {
    if (!node?.id) return
    if (initialScrollRatio == null || initialScrollRatio <= 0) return
    const el = scrollRef.current
    if (!el) return

    let cancelled = false
    let ro: ResizeObserver | null = null
    let timeoutId: number | null = null
    let raf2: number | null = null

    const restore = () => {
      if (cancelled) return
      const max = el.scrollHeight - el.clientHeight
      if (max > 0) {
        el.scrollTop = max * Math.min(Math.max(initialScrollRatio, 0), 1)
      }
      handleScroll()
    }

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        restore()
        onRestoreDone?.()

        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(() => {
            restore()
            ro?.disconnect()
            ro = null
          })
          const target = contentRef.current ?? el
          ro.observe(target)

          timeoutId = window.setTimeout(() => {
            ro?.disconnect()
            ro = null
          }, 1500)
        }
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      if (raf2 != null) cancelAnimationFrame(raf2)
      if (timeoutId != null) window.clearTimeout(timeoutId)
      ro?.disconnect()
      ro = null
    }
  }, [node?.id, initialScrollRatio, handleScroll, onRestoreDone])

  // 获取节点关联的地点信息
  const placeTags = useMemo<PlaceTag[]>(() => {
    if (!node?.map?.features) return []
    return node.map.features
      .filter((f) => f.type === 'place' && f.placeId)
      .map((f) => {
        const place = places.find((p) => p.id === f.placeId)
        return {
          id: f.placeId!,
          name: place?.name || f.placeId!,
          label: f.label || place?.name || f.placeId!,
        }
      })
      .filter((p) => p.id)
  }, [node, places])

  // 加载状态 — 骨架屏
  if (isLoading) {
    return (
      <div className="content-reader flex-1 min-h-0 flex flex-col animate-pulse">
        <div className="flex-shrink-0 px-6 lg:px-12 py-4 lg:py-8 border-b border-paper-700/50">
          <div className="h-7 w-48 bg-paper-700/50 rounded-md" />
          <div className="flex gap-4 mt-3">
            <div className="h-4 w-24 bg-paper-700/40 rounded" />
            <div className="h-4 w-32 bg-paper-700/40 rounded" />
          </div>
        </div>
        <div className="flex-1 px-6 lg:px-12 py-5 lg:py-10 space-y-5">
          <div className="h-4 w-full bg-paper-700/30 rounded" />
          <div className="h-4 w-11/12 bg-paper-700/30 rounded" />
          <div className="h-4 w-full bg-paper-700/30 rounded" />
          <div className="h-4 w-9/12 bg-paper-700/30 rounded" />
          <div className="h-4 w-full bg-paper-700/30 rounded" />
          <div className="h-4 w-10/12 bg-paper-700/30 rounded" />
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="content-reader flex-1 min-h-0 flex items-center justify-center">
        <div className="text-cinnabar-400 text-center">
          <p className="text-lg mb-2">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  // 无内容
  if (!node) {
    return (
      <div className="content-reader flex-1 min-h-0 flex items-center justify-center">
        <div className="text-paper-400 text-center">
          <p className="text-lg mb-2">请选择一个章节</p>
          <p className="text-sm">从左侧目录选择开始阅读</p>
        </div>
      </div>
    )
  }

  return (
    <article className="content-reader flex-1 min-h-0 flex flex-col">
      {/* 头部：标题、时间、地点 */}
      <header className="flex-shrink-0 px-6 lg:px-12 py-4 lg:py-8 border-b border-paper-700/50">
        <h1 className="chapter-title">{node.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm mt-3">
          {node.time?.display && (
            <span className="meta-tag">
              <ClockIcon />
              {node.time.display}
            </span>
          )}
          {placeTags.length > 0 && (
            <span className="meta-tag">
              <MapPinIcon />
              <span className="flex flex-wrap gap-1">
                {placeTags.map((place, idx) => (
                  <span key={place.id}>
                    {idx > 0 && <span className="text-paper-500">、</span>}
                    <button
                      onClick={() => onPlaceClick?.(place.id)}
                      onMouseEnter={() => onPlaceHover?.(place.id)}
                      onMouseLeave={() => onPlaceHover?.(null)}
                      className={`place-tag ${
                        highlightedPlaceId === place.id ? 'place-tag-active' : ''
                      }`}
                      title={`点击查看 ${place.name} 在地图上的位置`}
                    >
                      {place.label}
                    </button>
                  </span>
                ))}
              </span>
            </span>
          )}
        </div>
      </header>

      {/* 阅读进度条 */}
      <div className="h-0.5 bg-paper-700/30 flex-shrink-0" aria-hidden="true">
        <div
          className="h-full bg-accent-500/50 transition-[width] duration-150 ease-out"
          style={{ width: `${readProgress * 100}%` }}
        />
      </div>

      {/* 正文 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-12 py-5 lg:py-10"
      >
        <div ref={contentRef} className="reading-content-width mx-auto mdx-content">
          <MdxRenderer
            Content={node.content.Component}
            highlightedPlaceId={highlightedPlaceId}
            onPlaceClick={onPlaceClick}
            onPlaceHover={onPlaceHover}
          />
        </div>

        {/* 来源引用 */}
        {node.sources && node.sources.length > 0 && (
          <div className="source-citation reading-content-width mx-auto">
            <p>
              来源：
              {node.sources.map((s, idx) => (
                <span key={idx}>
                  {idx > 0 && '；'}
                  {s.title}
                  {s.loc && ` (${s.loc})`}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <footer className="flex-shrink-0 px-6 lg:px-12 pt-4 lg:pt-5 lg:pb-3 border-t border-paper-700/50 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-center">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="nav-button"
          >
            ← 上一节
          </button>

          <span className="text-xs text-paper-500 font-sans">
            {node.id}
          </span>

          <button
            onClick={onNext}
            disabled={!hasNext}
            className="nav-button"
          >
            下一节 →
          </button>
        </div>
        <div className="text-center mt-1.5 lg:mt-2">
          <a
            href="https://beian.miit.gov.cn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-paper-600 hover:text-paper-400 transition-colors"
          >
            京ICP备19003478号-1
          </a>
        </div>
      </footer>
    </article>
  )
}

// 图标组件
function ClockIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}
