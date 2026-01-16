'use client'

/**
 * 地图场景管理 Hook
 * 根据当前节点计算地图场景（地点标记、镜头位置）
 */

import { useMemo } from 'react'
import type { Node, Place, CameraConfig, FeatureRef } from '../types/narrative'

/** 地点标记配置 */
export interface PlaceMarker {
  id: string
  name: string
  label: string
  lng: number
  lat: number
  role: 'primary' | 'context'
}

/** 镜头目标 */
export interface CameraTarget {
  mode: 'preset' | 'autoFit'
  // preset 模式
  lng?: number
  lat?: number
  height?: number
  heading?: number
  pitch?: number
  // autoFit 模式
  bounds?: {
    west: number
    south: number
    east: number
    north: number
  }
  padding?: number
  // 动画
  durationMs: number
}

/** 地图场景 */
export interface MapScene {
  /** 场景 ID（用于判断是否需要更新） */
  sceneId: string
  /** 地点标记列表 */
  markers: PlaceMarker[]
  /** 镜头目标 */
  camera: CameraTarget
  /** 是否有路线 */
  hasRoute: boolean
  /** 路线起终点（如果有） */
  route?: {
    fromId: string
    toId: string
    fromCoord: { lng: number; lat: number }
    toCoord: { lng: number; lat: number }
  }
}

/**
 * 根据当前节点和地点库计算地图场景
 */
export function useMapScene(
  currentNode: Node | null,
  places: Place[]
): MapScene | null {
  return useMemo(() => {
    if (!currentNode) return null

    const { map } = currentNode
    if (!map) return null

    // 计算地点标记
    const markers: PlaceMarker[] = []
    for (const feature of map.features || []) {
      if (feature.type === 'place' && feature.placeId) {
        const place = places.find((p) => p.id === feature.placeId)
        if (place) {
          markers.push({
            id: place.id,
            name: place.name,
            label: feature.label || place.name,
            lng: place.coord.lng,
            lat: place.coord.lat,
            role: feature.role || 'context',
          })
        }
      }
    }

    // 计算镜头目标
    let camera: CameraTarget

    if (map.camera.mode === 'preset') {
      // 预设镜头
      camera = {
        mode: 'preset',
        lng: map.camera.lng,
        lat: map.camera.lat,
        height: map.camera.height || 10000,
        heading: map.camera.heading || 0,
        pitch: map.camera.pitch || -45,
        durationMs: map.camera.durationMs || 1200,
      }
    } else {
      // 自动适配：根据所有标记点计算边界
      if (markers.length === 0) {
        // 没有标记点，使用默认位置
        camera = {
          mode: 'preset',
          lng: 112.5,
          lat: 27.9,
          height: 50000,
          heading: 0,
          pitch: -60,
          durationMs: map.camera.durationMs || 1200,
        }
      } else if (markers.length === 1) {
        // 单个标记点，直接飞到
        const marker = markers[0]
        camera = {
          mode: 'preset',
          lng: marker.lng,
          lat: marker.lat,
          height: 10000,
          heading: 0,
          pitch: -45,
          durationMs: map.camera.durationMs || 1200,
        }
      } else {
        // 多个标记点，计算边界
        const lngs = markers.map((m) => m.lng)
        const lats = markers.map((m) => m.lat)
        const bounds = {
          west: Math.min(...lngs),
          east: Math.max(...lngs),
          south: Math.min(...lats),
          north: Math.max(...lats),
        }
        camera = {
          mode: 'autoFit',
          bounds,
          padding: map.camera.padding || 0.25,
          durationMs: map.camera.durationMs || 1200,
        }
      }
    }

    // 检查是否有路线
    let route: MapScene['route'] | undefined
    if (map.route && map.route.from && map.route.to) {
      const fromPlace = places.find((p) => p.id === map.route!.from)
      const toPlace = places.find((p) => p.id === map.route!.to)
      if (fromPlace && toPlace) {
        route = {
          fromId: fromPlace.id,
          toId: toPlace.id,
          fromCoord: fromPlace.coord,
          toCoord: toPlace.coord,
        }
      }
    }

    return {
      sceneId: currentNode.id,
      markers,
      camera,
      hasRoute: !!route,
      route,
    }
  }, [currentNode, places])
}

/**
 * 计算两点之间的中心点和合适的高度
 */
export function calculateCenterAndHeight(
  coord1: { lng: number; lat: number },
  coord2: { lng: number; lat: number }
): { lng: number; lat: number; height: number } {
  const lng = (coord1.lng + coord2.lng) / 2
  const lat = (coord1.lat + coord2.lat) / 2

  // 根据距离计算高度（简单估算）
  const dLng = Math.abs(coord1.lng - coord2.lng)
  const dLat = Math.abs(coord1.lat - coord2.lat)
  const maxDelta = Math.max(dLng, dLat)

  // 经验公式：每度约 111km，高度大约是跨度的 50-100 倍（km）
  const height = Math.max(maxDelta * 111 * 80, 5000) * 1000 // 转为米

  return { lng, lat, height: Math.min(height, 2000000) } // 最高 2000km
}

