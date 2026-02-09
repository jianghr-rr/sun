'use client'

/**
 * 正文阅读区组件
 * 显示节点标题、时间、正文内容，以及上一节/下一节导航
 * 地名标签可点击，触发地图聚焦
 */

import { useMemo } from 'react'
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
}: ContentReaderProps) {
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

  // 加载状态
  if (isLoading) {
    return (
      <div className="content-reader flex items-center justify-center h-full">
        <div className="text-paper-400">
          <div className="animate-pulse">加载中...</div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="content-reader flex items-center justify-center h-full">
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
      <div className="content-reader flex items-center justify-center h-full">
        <div className="text-paper-400 text-center">
          <p className="text-lg mb-2">请选择一个章节</p>
          <p className="text-sm">从左侧目录选择开始阅读</p>
        </div>
      </div>
    )
  }

  return (
    <article className="content-reader h-full flex flex-col">
      {/* 头部：标题、时间、地点 */}
      <header className="flex-shrink-0 px-8 lg:px-12 py-6 lg:py-8 border-b border-paper-700/50">
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

      {/* 正文 */}
      <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="max-w-prose mx-auto mdx-content">
          <MdxRenderer
            Content={node.content.Component}
            highlightedPlaceId={highlightedPlaceId}
            onPlaceClick={onPlaceClick}
            onPlaceHover={onPlaceHover}
          />
        </div>

        {/* 来源引用 */}
        {node.sources && node.sources.length > 0 && (
          <div className="source-citation max-w-prose mx-auto">
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
      <footer className="flex-shrink-0 px-8 lg:px-12 py-5 border-t border-paper-700/50 flex justify-between items-center">
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
