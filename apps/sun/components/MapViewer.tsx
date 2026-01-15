'use client'

import { useEffect, useRef } from 'react'
import {
  Viewer,
  ImageryLayer,
  WebMapTileServiceImageryProvider,
  Cartesian3,
  Math as CesiumMath,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// 天地图 key
const TDT_KEY = process.env.NEXT_PUBLIC_TDT_KEY || ''

// 天地图影像底图 URL
const TDT_IMG_URL = `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

// 天地图影像注记 URL
const TDT_CIA_URL = `https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

interface MapViewerProps {
  className?: string
}

export function MapViewer({ className }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    // 设置 Cesium 静态资源路径
    ;(window as any).CESIUM_BASE_URL = '/cesium'

    // 创建 Viewer
    const viewer = new Viewer(containerRef.current, {
      // 关闭默认底图
      baseLayerPicker: false,
      imageryProvider: false as any,
      // 关闭不需要的控件
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      // 地形
      terrain: undefined,
    })

    // 添加天地图影像底图
    const imgProvider = new WebMapTileServiceImageryProvider({
      url: TDT_IMG_URL,
      layer: 'img',
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18,
    })
    viewer.imageryLayers.addImageryProvider(imgProvider)

    // 添加天地图注记
    const ciaProvider = new WebMapTileServiceImageryProvider({
      url: TDT_CIA_URL,
      layer: 'cia',
      style: 'default',
      format: 'tiles',
      tileMatrixSetID: 'w',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18,
    })
    viewer.imageryLayers.addImageryProvider(ciaProvider)

    // 定位到中国
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(104.0, 35.0, 8000000), // 中国中心经纬度，高度 8000km
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90), // 俯视
        roll: 0,
      },
      duration: 2,
    })

    // 隐藏版权信息（可选，按需保留）
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    if (creditContainer) {
      creditContainer.style.display = 'none'
    }

    viewerRef.current = viewer

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}

export default MapViewer

