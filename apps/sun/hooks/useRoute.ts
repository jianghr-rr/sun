'use client'

/**
 * 路线获取 Hook
 * 根据起终点获取路线数据，带缓存
 */

import { useState, useEffect, useRef } from 'react'
import { getDrivingRoute, type RouteResult, type RoutePoint } from '../lib/amap'

/** 路线请求参数 */
export interface RouteRequest {
  fromId: string
  toId: string
  fromCoord: { lng: number; lat: number }
  toCoord: { lng: number; lat: number }
}

/** 路线状态 */
export interface RouteState {
  isLoading: boolean
  error: string | null
  data: RouteResult | null
  request: RouteRequest | null
}

// 全局路线缓存（按 fromId-toId 缓存）
const routeCache = new Map<string, RouteResult>()

/**
 * 获取路线数据 Hook
 */
export function useRoute(request: RouteRequest | null | undefined): RouteState {
  const [state, setState] = useState<RouteState>({
    isLoading: false,
    error: null,
    data: null,
    request: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 如果没有请求，清空状态
    if (!request) {
      setState({
        isLoading: false,
        error: null,
        data: null,
        request: null,
      })
      return
    }

    // 生成缓存 key
    const cacheKey = `${request.fromId}-${request.toId}`

    // 检查缓存
    const cached = routeCache.get(cacheKey)
    if (cached) {
      setState({
        isLoading: false,
        error: null,
        data: cached,
        request,
      })
      return
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // 开始加载
    setState({
      isLoading: true,
      error: null,
      data: null,
      request,
    })

    // 获取路线
    const fetchRoute = async () => {
      try {
        const result = await getDrivingRoute(
          request.fromCoord,
          request.toCoord
        )

        // 检查是否被取消
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        if (result) {
          // 缓存结果
          routeCache.set(cacheKey, result)
          setState({
            isLoading: false,
            error: null,
            data: result,
            request,
          })
        } else {
          setState({
            isLoading: false,
            error: '获取路线失败',
            data: null,
            request,
          })
        }
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }
        setState({
          isLoading: false,
          error: err instanceof Error ? err.message : '获取路线失败',
          data: null,
          request,
        })
      }
    }

    fetchRoute()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [request?.fromId, request?.toId])

  return state
}

/**
 * 清除路线缓存
 */
export function clearRouteCache(): void {
  routeCache.clear()
}

