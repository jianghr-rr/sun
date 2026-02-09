'use client'

/**
 * 阅读器布局组件
 * 左侧：目录（桌面端固定，移动端抽屉）
 * 右侧：正文阅读区（半透明卡片浮层）
 * 底层：地图（响应节点切换 + 路线绘制 + 双向联动）
 */

import { useState, useMemo, useCallback } from 'react'
import { TableOfContents } from './TableOfContents'
import { ContentReader } from './ContentReader'
import { DynamicMapViewer } from './DynamicMapViewer'
import { useNarrative } from '../hooks/useNarrative'
import { useMapScene } from '../hooks/useMapScene'
import { useRoute, type RouteRequest } from '../hooks/useRoute'

export function ReaderLayout() {
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

  // 文案区域折叠状态
  const [isContentCollapsed, setIsContentCollapsed] = useState(false)

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

  return (
    <div className="reader-layout relative w-full h-screen overflow-hidden bg-paper-950">
      {/* 底层：地图 */}
      <div className="absolute inset-0 z-0">
        <DynamicMapViewer
          className="cesium-viewer"
          scene={mapScene}
          routeData={routeData}
          highlightedPlaceId={highlightedPlaceId}
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

      {/* 移动端：目录按钮 */}
      <button
        onClick={() => setIsTocOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden icon-button shadow-card"
        aria-label="打开目录"
      >
        <MenuIcon />
      </button>

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
          sidebar-card
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 lg:z-10
          ${isTocOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 移动端：关闭按钮 */}
        <button
          onClick={() => setIsTocOpen(false)}
          className="absolute top-7 right-5 lg:hidden text-paper-400 hover:text-paper-100 transition-colors z-10"
          aria-label="关闭目录"
        >
          <CloseIcon />
        </button>

        <TableOfContents
          work={work}
          currentNodeId={currentNode?.id || null}
          onSelectNode={(nodeId) => {
            selectNode(nodeId)
            setIsTocOpen(false) // 移动端选择后关闭抽屉
          }}
          isLoading={isLoading}
        />
      </aside>

      {/* 右侧：正文阅读区 */}
      <main
        className={`
          fixed top-0 right-0 z-10 h-full
          w-full lg:w-[calc(100%-20rem)]
          lg:ml-80
          pointer-events-none
        `}
      >
        {/* 折叠/展开按钮 */}
        {currentNode && (
          <button
            onClick={() => setIsContentCollapsed(!isContentCollapsed)}
            className={`
              absolute z-20 pointer-events-auto
              icon-button shadow-card
              transition-all duration-300
              ${isContentCollapsed 
                ? 'top-4 right-4' 
                : 'top-4 right-[calc(min(100%-2rem,42rem)+1.5rem)]'
              }
            `}
            aria-label={isContentCollapsed ? '展开文案' : '收起文案'}
            title={isContentCollapsed ? '展开文案' : '收起文案'}
          >
            {isContentCollapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        )}

        {/* 阅读卡片 */}
        <div
          className={`
            absolute top-4 right-4 bottom-4
            w-[calc(100%-2rem)] max-w-2xl
            reader-card
            overflow-hidden
            pointer-events-auto
            transition-all duration-300 ease-out
            ${currentNode ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${isContentCollapsed 
              ? 'translate-x-[calc(100%+1rem)] opacity-0' 
              : 'translate-x-0 opacity-100'
            }
          `}
        >
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
