'use client'

/**
 * 阅读器布局组件
 * 左侧：目录（桌面端固定，移动端抽屉）
 * 右侧：正文阅读区（半透明卡片浮层）
 * 底层：地图（响应节点切换 + 路线绘制 + 双向联动）
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { TableOfContents } from './TableOfContents'
import { ContentReader } from './ContentReader'
import { DynamicMapViewer } from './DynamicMapViewer'
import { ThemeToggle } from './ThemeToggle'
import { useNarrative } from '../hooks/useNarrative'
import { useMapScene } from '../hooks/useMapScene'
import { useRoute, type RouteRequest } from '../hooks/useRoute'
import { useReadingProgress, type ReadingProgress } from '../hooks/useReadingProgress'

// 移动端底部面板吸附点 (vh)
const SNAP_POINTS = [0, 55, 90] as const
const SNAP_HALF = 55
const SNAP_FULL = 90
const SNAP_COLLAPSED = 0

function nearestSnap(vh: number): number {
  return SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - vh) < Math.abs(prev - vh) ? curr : prev
  )
}

export function ReaderLayout() {
  const searchParams = useSearchParams()
  const hadNodeParamOnEntryRef = useRef<boolean>(searchParams.get('node') != null)

  const {
    work,
    currentNode,
    nextNode,
    places,
    isLoading,
    error,
    selectNode,
    goToPrev,
    goToNext,
  } = useNarrative()

  const { load: loadReadingProgress, save: saveReadingProgress } = useReadingProgress(work?.id)
  const savedProgressRef = useRef<ReadingProgress | null>(null)
  const restoringRef = useRef(false)
  const restoringNodeIdRef = useRef<string | null>(null)
  const [initialScrollRatio, setInitialScrollRatio] = useState<number | undefined>(undefined)

  // 读取一次本地进度（workId ready 后）
  useEffect(() => {
    if (!work?.id) return
    savedProgressRef.current = loadReadingProgress()
  }, [work?.id, loadReadingProgress])

  // 节点变化时：决定是否进入“恢复阶段”，并避免写 0 覆盖
  useEffect(() => {
    const nodeId = currentNode?.id
    if (!nodeId) return

    // 同一节点的重复渲染/回调期间，禁止写入 0 覆盖（主要防首屏恢复竞态）
    if (restoringNodeIdRef.current === nodeId) return

    const saved = savedProgressRef.current
    if (
      !hadNodeParamOnEntryRef.current &&
      saved &&
      saved.nodeId === nodeId &&
      saved.scrollRatio > 0 &&
      restoringNodeIdRef.current !== nodeId
    ) {
      restoringRef.current = true
      restoringNodeIdRef.current = nodeId
      setInitialScrollRatio(saved.scrollRatio)
      return
    }

    restoringRef.current = false
    restoringNodeIdRef.current = null
    setInitialScrollRatio(undefined)

    // 记录当前节点（默认顶端），用于“切到新节点后未滚动就退出”的场景
    saveReadingProgress(nodeId, 0, { immediate: true })
  }, [currentNode?.id, saveReadingProgress])

  const handleRestoreDone = useCallback(() => {
    const nodeId = currentNode?.id
    if (!nodeId) return

    const saved = savedProgressRef.current
    if (saved && saved.nodeId === nodeId && saved.scrollRatio > 0) {
      saveReadingProgress(nodeId, saved.scrollRatio, { immediate: true })
    }
    restoringRef.current = false
  }, [currentNode?.id, saveReadingProgress])

  const handleScrollProgress = useCallback(
    (ratio: number) => {
      const nodeId = currentNode?.id
      if (!nodeId) return
      if (restoringRef.current) return
      saveReadingProgress(nodeId, ratio)
    },
    [currentNode?.id, saveReadingProgress]
  )

  // 计算地图场景
  const mapScene = useMapScene(currentNode, places, nextNode)

  // 准备路线请求
  const routeRequest = useMemo<RouteRequest | null>(() => {
    if (!mapScene?.route) return null
    return {
      fromId: mapScene.route.fromId,
      toId: mapScene.route.toId,
      fromCoord: mapScene.route.fromCoord,
      toCoord: mapScene.route.toCoord,
    }
  }, [mapScene?.route])

  // 获取路线数据
  const { data: routeData, isLoading: routeLoading } = useRoute(routeRequest)

  // 高亮地点状态（双向联动）
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null)

  // 移动端目录抽屉状态
  const [isTocOpen, setIsTocOpen] = useState(false)

  // 桌面端折叠
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  // 移动端底部面板高度 (vh) + 拖拽状态
  const [sheetVh, setSheetVh] = useState(SNAP_HALF)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startY: 0, startVh: 0, ts: 0 })

  const isMobileCollapsed = sheetVh === SNAP_COLLAPSED

  const hasPrev = !!currentNode?.links?.prev
  const hasNext = !!currentNode?.links?.next

  // 正文点击地名
  const handlePlaceClick = useCallback((placeId: string) => {
    setHighlightedPlaceId(placeId)
    // 3秒后取消高亮
    setTimeout(() => setHighlightedPlaceId(null), 3000)
  }, [])

  // 正文悬停地名
  const handlePlaceHover = useCallback((placeId: string | null) => {
    // 悬停时临时高亮，不覆盖点击高亮
    if (placeId) {
      setHighlightedPlaceId(placeId)
    }
  }, [])

  // 地图点击标记
  const handleMarkerClick = useCallback((placeId: string) => {
    setHighlightedPlaceId(placeId)
    // 3秒后取消高亮
    setTimeout(() => setHighlightedPlaceId(null), 3000)
  }, [])

  // 地图悬停标记
  const handleMarkerHover = useCallback((placeId: string | null) => {
    if (placeId) {
      setHighlightedPlaceId(placeId)
    }
  }, [])

  // 触摸拖拽手柄
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startVh: sheetVh,
      ts: Date.now(),
    }
    setIsDragging(true)
  }, [sheetVh])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = dragRef.current.startY - e.touches[0].clientY
    const deltaVh = (deltaY / window.innerHeight) * 100
    const newVh = Math.max(0, Math.min(95, dragRef.current.startVh + deltaVh))
    setSheetVh(newVh)
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    const elapsed = Date.now() - dragRef.current.ts
    const velocityVh = (sheetVh - dragRef.current.startVh) / Math.max(elapsed, 1) * 1000

    setIsDragging(false)

    // 快速滑动（flick）：根据速度方向决定吸附
    if (Math.abs(velocityVh) > 60) {
      const target = velocityVh > 0
        ? SNAP_POINTS.find(p => p > dragRef.current.startVh) ?? SNAP_FULL
        : [...SNAP_POINTS].reverse().find(p => p < dragRef.current.startVh) ?? SNAP_COLLAPSED
      setSheetVh(target)
      return
    }
    setSheetVh(nearestSnap(sheetVh))
  }, [isDragging, sheetVh])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrev) { e.preventDefault(); goToPrev() }
          break
        case 'ArrowRight':
          if (hasNext) { e.preventDefault(); goToNext() }
          break
        case 'Escape':
          if (isTocOpen) { setIsTocOpen(false) }
          else if (!isDesktopCollapsed && currentNode) { setIsDesktopCollapsed(true) }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasPrev, hasNext, goToPrev, goToNext, isTocOpen, isDesktopCollapsed, currentNode])

  return (
    <div className="reader-layout relative w-full h-screen overflow-hidden bg-paper-950">
      {/* Skip Link — 键盘聚焦时可见 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:bg-accent-500 focus:text-paper-950 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-card"
      >
        跳转到正文
      </a>

      {/* 底层：地图 */}
      <div className="absolute inset-0 z-0">
        <DynamicMapViewer
          className="cesium-viewer"
          scene={mapScene}
          routeData={routeData}
          highlightedPlaceId={highlightedPlaceId}
          bottomSheetVh={sheetVh}
          onMarkerClick={handleMarkerClick}
          onMarkerHover={handleMarkerHover}
        />
      </div>

      {/* 路线加载指示器 */}
      {routeLoading && mapScene?.hasRoute && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 bg-paper-800/95 backdrop-blur-sm text-paper-200 px-4 py-2 rounded-lg text-sm shadow-soft">
          路线加载中...
        </div>
      )}

      {/* 左上角控制按钮 */}
      <div className="fixed top-4 left-4 z-50 flex gap-2 max-lg:z-50 lg:left-[21.5rem]">
        <button
          onClick={() => setIsTocOpen(true)}
          className="icon-button shadow-card lg:hidden"
          aria-label="打开目录"
        >
          <MenuIcon />
        </button>
        <ThemeToggle />
      </div>

      {/* 移动端：目录抽屉遮罩 */}
      {isTocOpen && (
        <div
          className="fixed inset-0 z-40 bg-paper-950/60 backdrop-blur-sm lg:hidden transition-smooth"
          onClick={() => setIsTocOpen(false)}
        />
      )}

      {/* 左侧：目录 */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-80
          flex flex-col
          sidebar-card
          transform transition-transform duration-300 ease-out
          will-change-transform
          lg:translate-x-0 lg:z-10
          ${isTocOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 移动端：关闭按钮 */}
        <button
          onClick={() => setIsTocOpen(false)}
          className="absolute top-5 right-3 lg:hidden text-paper-400 hover:text-paper-100 transition-colors z-10 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="关闭目录"
        >
          <CloseIcon />
        </button>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TableOfContents
            work={work}
            currentNodeId={currentNode?.id || null}
            onSelectNode={(nodeId) => {
              selectNode(nodeId)
              setIsTocOpen(false)
            }}
            isLoading={isLoading}
          />
        </div>

      </aside>

      {/* 右侧：正文阅读区 */}
      <main
        id="main-content"
        className={`
          fixed top-0 right-0 z-10 h-full
          w-full lg:w-[calc(100%-20rem)]
          lg:ml-80
          pointer-events-none
        `}
      >
        {/* 桌面端：折叠/展开按钮 */}
        {currentNode && (
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className={`
              absolute z-20 pointer-events-auto
              icon-button shadow-card
              transition-all duration-300
              hidden lg:flex
              ${isDesktopCollapsed 
                ? 'top-4 right-4' 
                : 'top-4 right-[calc(min(100%-2rem,42rem)+1.5rem)]'
              }
            `}
            aria-label={isDesktopCollapsed ? '展开文案' : '收起文案'}
            title={isDesktopCollapsed ? '展开文案' : '收起文案'}
          >
            {isDesktopCollapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        )}

        {/* 移动端：折叠时的展开按钮（浮在右下角） */}
        {currentNode && isMobileCollapsed && (
          <button
            onClick={() => setSheetVh(SNAP_HALF)}
            className="fixed bottom-6 right-4 z-20 pointer-events-auto lg:hidden icon-button shadow-card"
            aria-label="展开文案"
          >
            <ChevronUpIcon />
          </button>
        )}

        {/* 阅读卡片 — 桌面端：右侧浮层 / 移动端：底部面板 */}
        <div
          className={`
            reader-card reader-card-sheet
            pointer-events-auto
            overflow-hidden
            flex flex-col
            transition-all duration-300 ease-out
            will-change-transform

            fixed left-0 right-0 bottom-0

            lg:absolute lg:top-4 lg:right-4 lg:bottom-4 lg:left-auto
            lg:w-[calc(100%-2rem)] lg:max-w-2xl
            lg:h-auto lg:rounded-2xl

            ${isDragging ? 'is-dragging' : ''}
            ${currentNode ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${isDesktopCollapsed 
              ? 'lg:translate-x-[calc(100%+1rem)] lg:opacity-0' 
              : 'lg:translate-x-0 lg:opacity-100'
            }
            ${isMobileCollapsed
              ? 'max-lg:translate-y-full max-lg:opacity-0'
              : 'max-lg:translate-y-0 max-lg:opacity-100'
            }
          `}
          style={{ '--sheet-h': `${sheetVh}vh` } as React.CSSProperties}
        >
          {/* 移动端：拖拽手柄 */}
          <div
            className="sheet-handle lg:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (sheetVh === SNAP_HALF) setSheetVh(SNAP_FULL)
              else if (sheetVh === SNAP_FULL) setSheetVh(SNAP_HALF)
              else setSheetVh(SNAP_HALF)
            }}
            role="button"
            tabIndex={0}
            aria-label="拖拽调整阅读区域高度"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSheetVh(sheetVh === SNAP_FULL ? SNAP_HALF : SNAP_FULL)
              }
            }}
          />

          <ContentReader
            node={currentNode}
            places={places}
            isLoading={isLoading}
            error={error}
            onPrev={goToPrev}
            onNext={goToNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
            highlightedPlaceId={highlightedPlaceId}
            onPlaceClick={handlePlaceClick}
            onPlaceHover={handlePlaceHover}
            onScrollProgress={handleScrollProgress}
            initialScrollRatio={initialScrollRatio}
            onRestoreDone={handleRestoreDone}
          />
        </div>

        {/* 无内容时的提示 */}
        {!currentNode && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="reader-card p-8 text-center max-w-md mx-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-paper-100 mb-3 font-sans">
                毛泽东大传
              </h2>
              <p className="text-paper-400 mb-5">
                点击左侧目录或下方按钮开始阅读
              </p>
              <button
                onClick={() => setIsTocOpen(true)}
                className="lg:hidden btn btn-primary"
              >
                打开目录
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// 图标组件
function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

// 折叠图标（向右箭头）
function CollapseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 5l7 7-7 7M5 5l7 7-7 7"
      />
    </svg>
  )
}

// 展开图标（向左箭头）
function ExpandIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
      />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.5 15.75l7.5-7.5 7.5 7.5"
      />
    </svg>
  )
}
