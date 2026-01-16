'use client'

import dynamic from 'next/dynamic'
import type { MapScene } from '../hooks/useMapScene'
import type { RouteResult } from '../lib/amap'

interface DynamicMapViewerProps {
  className?: string
  scene?: MapScene | null
  routeData?: RouteResult | null
  highlightedPlaceId?: string | null
  onMarkerClick?: (placeId: string) => void
  onMarkerHover?: (placeId: string | null) => void
}

// 动态导入 MapViewer，禁用 SSR（Cesium 需要浏览器 API）
export const DynamicMapViewer = dynamic<DynamicMapViewerProps>(
  () => import('./MapViewer'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#888',
        }}
      >
        地图加载中...
      </div>
    ),
  }
)

export default DynamicMapViewer
