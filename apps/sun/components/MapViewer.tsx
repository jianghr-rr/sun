'use client'

import { useEffect, useRef, useCallback } from 'react'
import {
  Viewer,
  WebMapTileServiceImageryProvider,
  Cartesian3,
  Math as CesiumMath,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  Rectangle,
  Entity,
  PolylineGlowMaterialProperty,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  defined,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import type { MapScene, PlaceMarker } from '../hooks/useMapScene'
import type { RouteResult } from '../lib/amap'

// 天地图 key
const TDT_KEY = process.env.NEXT_PUBLIC_TDT_KEY || ''

// 天地图影像底图 URL
const TDT_IMG_URL = `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

// 天地图影像注记 URL
const TDT_CIA_URL = `https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${TDT_KEY}`

const UNIFIED_CAMERA_HEIGHT = 2000000
const UNIFIED_CAMERA_PITCH = -90
const MOBILE_BREAKPOINT = 1024
/**
 * 移动端底部面板遮住 sheetFraction 屏幕，需要将相机目标南移，
 * 让目标点出现在上方可见区域的中央。
 */
function getMobileLatOffset(cameraHeight: number, sheetFraction: number): number {
  if (typeof window === 'undefined' || window.innerWidth >= MOBILE_BREAKPOINT) return 0

  const halfFovRad = Math.PI / 6
  const groundFullRange = 2 * cameraHeight * Math.tan(halfFovRad)
  const visibleLatRange = groundFullRange / 111320

  return (sheetFraction / 2) * visibleLatRange
}

// 地图标记色 — 与 globals.css @theme 中的 --color-marker-* 保持同步
const MARKER_COLORS = {
  primary: '#ef4444',
  context: '#3b82f6',
  highlight: '#facc15',
  routeStart: '#22c55e',
  routeEnd: '#f97316',
  routeLine: '#00ffff',
} as const

const MARKER_STYLES = {
  primary: {
    pixelSize: 14,
    color: Color.fromCssColorString(MARKER_COLORS.primary),
    outlineColor: Color.WHITE,
    outlineWidth: 3,
    labelFont: 'bold 16px sans-serif',
    labelColor: Color.fromCssColorString('#fef08a'),
  },
  context: {
    pixelSize: 10,
    color: Color.fromCssColorString(MARKER_COLORS.context),
    outlineColor: Color.WHITE,
    outlineWidth: 2,
    labelFont: '14px sans-serif',
    labelColor: Color.fromCssColorString('#e5e5e5'),
  },
  highlighted: {
    pixelSize: 18,
    color: Color.fromCssColorString(MARKER_COLORS.highlight),
    outlineColor: Color.WHITE,
    outlineWidth: 4,
    labelFont: 'bold 18px sans-serif',
    labelColor: Color.fromCssColorString('#ffffff'),
  },
  routeStart: {
    pixelSize: 16,
    color: Color.fromCssColorString(MARKER_COLORS.routeStart),
    outlineColor: Color.WHITE,
    outlineWidth: 3,
  },
  routeEnd: {
    pixelSize: 16,
    color: Color.fromCssColorString(MARKER_COLORS.routeEnd),
    outlineColor: Color.WHITE,
    outlineWidth: 3,
  },
}

interface MapViewerProps {
  className?: string
  scene?: MapScene | null
  routeData?: RouteResult | null
  highlightedPlaceId?: string | null
  bottomSheetVh?: number
  onMarkerClick?: (placeId: string) => void
  onMarkerHover?: (placeId: string | null) => void
}

export function MapViewer({
  className,
  scene,
  routeData,
  highlightedPlaceId,
  bottomSheetVh = 55,
  onMarkerClick,
  onMarkerHover,
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const markersRef = useRef<Map<string, Entity>>(new Map())
  const routeEntityRef = useRef<Entity | null>(null)
  const routeMarkersRef = useRef<Entity[]>([])
  const lastSceneIdRef = useRef<string | null>(null)
  const lastRouteKeyRef = useRef<string | null>(null)
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null)

  // 初始化 Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    // 设置 Cesium 静态资源路径
    ;(window as any).CESIUM_BASE_URL = '/cesium'

    // 创建 Viewer
    const viewer = new Viewer(containerRef.current, {
      baseLayerPicker: false,
      baseLayer: false,
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

    // 隐藏版权信息
    const creditContainer = viewer.cesiumWidget.creditContainer as HTMLElement
    if (creditContainer) {
      creditContainer.style.display = 'none'
    }

    // 初始定位到长沙（移动端南移避开底部面板）
    const initOffset = getMobileLatOffset(UNIFIED_CAMERA_HEIGHT, bottomSheetVh / 100)
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(112.94, 28.23 - initOffset, UNIFIED_CAMERA_HEIGHT),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(UNIFIED_CAMERA_PITCH),
        roll: 0,
      },
    })

    viewerRef.current = viewer

    // 设置点击和悬停事件处理
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    handlerRef.current = handler

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy()
        handlerRef.current = null
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  // 设置事件处理器
  useEffect(() => {
    const handler = handlerRef.current
    const viewer = viewerRef.current
    if (!handler || !viewer) return

    // 点击事件
    handler.setInputAction((movement: { position: Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(movement.position)
      if (defined(pickedObject) && pickedObject.id) {
        const entityId = pickedObject.id.id as string
        if (entityId?.startsWith('marker-')) {
          const placeId = entityId.replace('marker-', '')
          onMarkerClick?.(placeId)
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    // 悬停事件
    handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(movement.endPosition)
      if (defined(pickedObject) && pickedObject.id) {
        const entityId = pickedObject.id.id as string
        if (entityId?.startsWith('marker-')) {
          const placeId = entityId.replace('marker-', '')
          onMarkerHover?.(placeId)
          viewer.canvas.style.cursor = 'pointer'
          return
        }
      }
      onMarkerHover?.(null)
      viewer.canvas.style.cursor = 'default'
    }, ScreenSpaceEventType.MOUSE_MOVE)
  }, [onMarkerClick, onMarkerHover])

  // 添加标记点
  const addMarker = useCallback((marker: PlaceMarker, isHighlighted: boolean): Entity | null => {
    const viewer = viewerRef.current
    if (!viewer) return null

    const style = isHighlighted ? MARKER_STYLES.highlighted : MARKER_STYLES[marker.role]

    const entity = viewer.entities.add({
      id: `marker-${marker.id}`,
      name: marker.name,
      position: Cartesian3.fromDegrees(marker.lng, marker.lat),
      point: {
        pixelSize: style.pixelSize,
        color: style.color,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
      },
      label: {
        text: marker.label,
        font: style.labelFont,
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 3,
        outlineColor: Color.BLACK,
        fillColor: style.labelColor,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -18),
        showBackground: marker.role === 'primary' || isHighlighted,
        backgroundColor: isHighlighted
          ? Color.fromCssColorString('rgba(250,204,21,0.3)')
          : Color.fromCssColorString('rgba(0,0,0,0.6)'),
      },
    })

    return entity
  }, [])

  // 清除所有标记
  const clearMarkers = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    markersRef.current.forEach((entity) => {
      viewer.entities.remove(entity)
    })
    markersRef.current.clear()
  }, [])

  // 清除路线
  const clearRoute = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    // 清除路线实体
    if (routeEntityRef.current) {
      viewer.entities.remove(routeEntityRef.current)
      routeEntityRef.current = null
    }

    // 清除路线标记
    routeMarkersRef.current.forEach((entity) => {
      viewer.entities.remove(entity)
    })
    routeMarkersRef.current = []
  }, [])

  // 绘制路线
  const drawRoute = useCallback((route: RouteResult, startLabel?: string, endLabel?: string) => {
    const viewer = viewerRef.current
    if (!viewer || route.path.length < 2) return

    // 清除旧路线
    clearRoute()

    // 转换坐标
    const positions = route.path.map((p) => Cartesian3.fromDegrees(p.lng, p.lat))

    // 绘制路线
    routeEntityRef.current = viewer.entities.add({
      id: 'route-line',
      polyline: {
        positions,
        width: 8,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Color.fromCssColorString(MARKER_COLORS.routeLine),
        }),
        clampToGround: true,
      },
    })

    // 起点标记
    const startPoint = route.path[0]
    const startMarker = viewer.entities.add({
      id: 'route-start',
      position: Cartesian3.fromDegrees(startPoint.lng, startPoint.lat),
      point: {
        pixelSize: MARKER_STYLES.routeStart.pixelSize,
        color: MARKER_STYLES.routeStart.color,
        outlineColor: MARKER_STYLES.routeStart.outlineColor,
        outlineWidth: MARKER_STYLES.routeStart.outlineWidth,
      },
      label: startLabel ? {
        text: `起：${startLabel}`,
        font: 'bold 14px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 3,
        outlineColor: Color.BLACK,
        fillColor: Color.fromCssColorString('#86efac'),
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -20),
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
      } : undefined,
    })
    routeMarkersRef.current.push(startMarker)

    // 终点标记
    const endPoint = route.path[route.path.length - 1]
    const endMarker = viewer.entities.add({
      id: 'route-end',
      position: Cartesian3.fromDegrees(endPoint.lng, endPoint.lat),
      point: {
        pixelSize: MARKER_STYLES.routeEnd.pixelSize,
        color: MARKER_STYLES.routeEnd.color,
        outlineColor: MARKER_STYLES.routeEnd.outlineColor,
        outlineWidth: MARKER_STYLES.routeEnd.outlineWidth,
      },
      label: endLabel ? {
        text: `终：${endLabel}`,
        font: 'bold 14px sans-serif',
        style: LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 3,
        outlineColor: Color.BLACK,
        fillColor: Color.fromCssColorString('#fdba74'),
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -20),
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
      } : undefined,
    })
    routeMarkersRef.current.push(endMarker)
  }, [clearRoute])

  // 飞到指定位置（移动端自动南移避开底部面板）
  const flyToCamera = useCallback((camera: MapScene['camera']) => {
    const viewer = viewerRef.current
    if (!viewer) return

    const latOffset = getMobileLatOffset(UNIFIED_CAMERA_HEIGHT, bottomSheetVh / 100)

    if (camera.mode === 'preset' && camera.lng !== undefined && camera.lat !== undefined) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          camera.lng,
          camera.lat - latOffset,
          UNIFIED_CAMERA_HEIGHT
        ),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(UNIFIED_CAMERA_PITCH),
          roll: 0,
        },
        duration: (camera.durationMs || 1200) / 1000,
      })
    } else if (camera.mode === 'autoFit' && camera.bounds) {
      const padding = camera.padding || 0.25
      const { west, south, east, north } = camera.bounds

      const dLng = (east - west) * padding
      const dLat = (north - south) * padding

      const centerLng = (west + east) / 2
      const centerLat = (south + north) / 2

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(centerLng, centerLat - latOffset, UNIFIED_CAMERA_HEIGHT),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(UNIFIED_CAMERA_PITCH),
          roll: 0,
        },
        duration: (camera.durationMs || 1200) / 1000,
      })
    }
  }, [bottomSheetVh])

  // 飞到指定地点（移动端自动南移避开底部面板）
  const flyToPlace = useCallback((placeId: string, markers: PlaceMarker[]) => {
    const viewer = viewerRef.current
    if (!viewer) return

    const marker = markers.find((m) => m.id === placeId)
    if (!marker) return

    const latOffset = getMobileLatOffset(UNIFIED_CAMERA_HEIGHT, bottomSheetVh / 100)

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(marker.lng, marker.lat - latOffset, UNIFIED_CAMERA_HEIGHT),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(UNIFIED_CAMERA_PITCH),
        roll: 0,
      },
      duration: 0.8,
    })
  }, [bottomSheetVh])

  // 场景变化时更新地图
  useEffect(() => {
    if (!scene || !viewerRef.current) return

    // 如果场景没变，不更新标记（但高亮可能变了）
    if (scene.sceneId === lastSceneIdRef.current) {
      // 仅更新高亮状态
      clearMarkers()
      scene.markers.forEach((marker) => {
        const isHighlighted = highlightedPlaceId === marker.id
        const entity = addMarker(marker, isHighlighted)
        if (entity) {
          markersRef.current.set(marker.id, entity)
        }
      })
      return
    }

    lastSceneIdRef.current = scene.sceneId

    // 清除旧标记和路线
    clearMarkers()
    clearRoute()

    // 添加新标记
    scene.markers.forEach((marker) => {
      const isHighlighted = highlightedPlaceId === marker.id
      const entity = addMarker(marker, isHighlighted)
      if (entity) {
        markersRef.current.set(marker.id, entity)
      }
    })

    // 飞到目标位置
    flyToCamera(scene.camera)
  }, [scene, highlightedPlaceId, clearMarkers, clearRoute, addMarker, flyToCamera])

  // 高亮变化时更新标记样式（无需重建场景）
  useEffect(() => {
    if (!scene || !viewerRef.current) return

    // 更新所有标记的样式
    clearMarkers()
    scene.markers.forEach((marker) => {
      const isHighlighted = highlightedPlaceId === marker.id
      const entity = addMarker(marker, isHighlighted)
      if (entity) {
        markersRef.current.set(marker.id, entity)
      }
    })

    // 如果有高亮，飞到该位置
    if (highlightedPlaceId && scene.markers.some((m) => m.id === highlightedPlaceId)) {
      flyToPlace(highlightedPlaceId, scene.markers)
    }
  }, [highlightedPlaceId, scene, clearMarkers, addMarker, flyToPlace])

  // 路线数据变化时绘制路线
  useEffect(() => {
    if (!viewerRef.current) return

    // 生成路线 key
    const routeKey = scene?.route ? `${scene.route.fromId}-${scene.route.toId}` : null

    // 如果路线没变，不更新
    if (routeKey === lastRouteKeyRef.current && !routeData) return

    // 如果没有路线数据，清除路线
    if (!routeData || !scene?.route) {
      clearRoute()
      lastRouteKeyRef.current = null
      return
    }

    lastRouteKeyRef.current = routeKey

    // 找到起终点的标签
    const fromMarker = scene.markers.find((m) => m.id === scene.route?.fromId)
    const toMarker = scene.markers.find((m) => m.id === scene.route?.toId)

    // 绘制路线
    drawRoute(routeData, fromMarker?.label, toMarker?.label)
  }, [routeData, scene, clearRoute, drawRoute])

  return (
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default MapViewer
