'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Viewer,
  WebMapTileServiceImageryProvider,
  Cartesian3,
  Math as CesiumMath,
  Color,
  PolylineGlowMaterialProperty,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { getDrivingRoute, type RoutePoint } from '../lib/amap'

// 天地图 key
const TDT_KEY = process.env.NEXT_PUBLIC_TDT_KEY || ''

// 天地图影像底图 URL
const TDT_IMG_URL = `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

// 天地图影像注记 URL
const TDT_CIA_URL = `https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

// 示例数据：抚州 → 南昌
const DEMO_ENDPOINTS = [
  { name: '抚州', lng: 116.358, lat: 27.948 },
  { name: '南昌', lng: 115.858, lat: 28.682 },
]

interface MapViewerProps {
  className?: string
}

export function MapViewer({ className }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    // 设置 Cesium 静态资源路径
    ;(window as any).CESIUM_BASE_URL = '/cesium'

    // 创建 Viewer
    const viewer = new Viewer(containerRef.current, {
      baseLayerPicker: false,
      imageryProvider: false as any,
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

    // 添加天地图影像注记
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

    // 添加起点和终点标记
    DEMO_ENDPOINTS.forEach((point, index) => {
      const isStart = index === 0
      viewer.entities.add({
        name: point.name,
        position: Cartesian3.fromDegrees(point.lng, point.lat),
        point: {
          pixelSize: 16,
          color: isStart ? Color.fromCssColorString('#00ff88') : Color.fromCssColorString('#ff6600'),
          outlineColor: Color.WHITE,
          outlineWidth: 3,
        },
        label: {
          text: point.name,
          font: 'bold 18px sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 3,
          outlineColor: Color.BLACK,
          fillColor: Color.fromCssColorString('#ffff00'), // 黄色文字更醒目
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -22),
        },
      })
    })

    // 定位到抚州-南昌路线中心
    const centerLng = (DEMO_ENDPOINTS[0].lng + DEMO_ENDPOINTS[1].lng) / 2
    const centerLat = (DEMO_ENDPOINTS[0].lat + DEMO_ENDPOINTS[1].lat) / 2
    
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(centerLng, centerLat, 200000), // 200km 高度
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90), // 正俯视
        roll: 0,
      },
    })

    // 隐藏版权信息
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    if (creditContainer) {
      creditContainer.style.display = 'none'
    }

    viewerRef.current = viewer

    // 获取高德路线规划
    const fetchRoute = async () => {
      const origin = DEMO_ENDPOINTS[0]
      const destination = DEMO_ENDPOINTS[1]

      const result = await getDrivingRoute(origin, destination)

      if (result && viewerRef.current) {
        // 渲染路线
        const routePositions = result.path.map((p: RoutePoint) =>
          Cartesian3.fromDegrees(p.lng, p.lat)
        )

        viewerRef.current.entities.add({
          name: '抚州 → 南昌',
          polyline: {
            positions: routePositions,
            width: 10,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.4,
              color: Color.fromCssColorString('#00ffff'), // 青色，在卫星图上很明显
            }),
            clampToGround: true,
          },
        })

        // 更新路线信息
        setRouteInfo({
          distance: result.distance,
          duration: result.duration,
        })
      }
    }

    fetchRoute()

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* 路线信息面板 */}
      {routeInfo && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 14,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>抚州 → 南昌</div>
          <div>距离：{(routeInfo.distance / 1000).toFixed(1)} 公里</div>
          <div>预计：{Math.round(routeInfo.duration / 60)} 分钟</div>
        </div>
      )}
    </div>
  )
}

export default MapViewer
