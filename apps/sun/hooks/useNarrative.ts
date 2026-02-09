'use client'

/**
 * 叙事阅读器状态管理 Hook
 * 管理当前选中的节点、数据加载、URL 同步
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Work, Node, Place } from '../types/narrative'
import {
  getWorkStructure,
  getNodeById,
  loadChapterNodes,
  loadPlaces,
  getFirstNodeId,
} from '../lib/narrative'

export interface NarrativeState {
  // 作品结构
  work: Work | null
  // 当前节点
  currentNode: Node | null
  // 下一节点（用于跨章节路径）
  nextNode: Node | null
  // 当前章节的所有节点
  chapterNodes: Node[]
  // 地点库
  places: Place[]
  // 加载状态
  isLoading: boolean
  // 错误信息
  error: string | null
}

export interface NarrativeActions {
  // 选择节点
  selectNode: (nodeId: string) => void
  // 上一节
  goToPrev: () => void
  // 下一节
  goToNext: () => void
  // 刷新数据
  refresh: () => void
}

export function useNarrative(): NarrativeState & NarrativeActions {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 状态
  const [work, setWork] = useState<Work | null>(null)
  const [currentNode, setCurrentNode] = useState<Node | null>(null)
  const [nextNode, setNextNode] = useState<Node | null>(null)
  const [chapterNodes, setChapterNodes] = useState<Node[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 防止重复初始化
  const initedRef = useRef(false)

  // 从 URL 获取当前节点 ID
  const nodeIdFromUrl = searchParams.get('node')

  // 更新 URL 参数
  const updateUrl = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('node', nodeId)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // 初始化：加载作品结构和地点库
  useEffect(() => {
    if (initedRef.current) return
    initedRef.current = true

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        console.log('[useNarrative] 开始加载数据...')

        // 并行加载作品结构和地点库
        const [workData, placesData] = await Promise.all([
          getWorkStructure(),
          loadPlaces(),
        ])

        console.log('[useNarrative] 数据加载成功:', {
          work: workData?.title,
          volumes: workData?.volumes?.length,
          places: placesData?.length,
        })

        setWork(workData)
        setPlaces(placesData)
        setIsLoading(false)
      } catch (err) {
        console.error('[useNarrative] 加载失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // 如果 URL 中没有节点 ID 且 work 已加载，加载第一个节点
  useEffect(() => {
    if (nodeIdFromUrl || !work) return

    async function loadFirstNode() {
      try {
        const firstNodeId = await getFirstNodeId()
        if (firstNodeId) {
          console.log('[useNarrative] 自动选择第一个节点:', firstNodeId)
          updateUrl(firstNodeId)
        }
      } catch (err) {
        console.error('[useNarrative] 加载第一个节点失败:', err)
      }
    }

    loadFirstNode()
  }, [nodeIdFromUrl, work, updateUrl])

  // 当 URL 中的节点 ID 变化时，加载对应节点
  useEffect(() => {
    if (!nodeIdFromUrl) return

    async function loadNode() {
      try {
        setIsLoading(true)

        console.log('[useNarrative] 加载节点:', nodeIdFromUrl)

        // 加载节点数据
        const node = await getNodeById(nodeIdFromUrl)

        if (!node) {
          setError(`节点不存在: ${nodeIdFromUrl}`)
          setIsLoading(false)
          setNextNode(null)
          return
        }

        setCurrentNode(node)

        if (node.links?.next) {
          const next = await getNodeById(node.links.next)
          setNextNode(next || null)
        } else {
          setNextNode(null)
        }

        // 加载该章节的所有节点（用于目录高亮）
        const { nodes } = await loadChapterNodes(node.volume, node.chapter)
        setChapterNodes(nodes)
        setIsLoading(false)
      } catch (err) {
        console.error('[useNarrative] 加载节点失败:', err)
        setError(err instanceof Error ? err.message : '加载节点失败')
        setIsLoading(false)
      }
    }

    loadNode()
  }, [nodeIdFromUrl])

  // 选择节点
  const selectNode = useCallback(
    (nodeId: string) => {
      updateUrl(nodeId)
    },
    [updateUrl]
  )

  // 上一节
  const goToPrev = useCallback(() => {
    if (currentNode?.links?.prev) {
      selectNode(currentNode.links.prev)
    }
  }, [currentNode, selectNode])

  // 下一节
  const goToNext = useCallback(() => {
    if (currentNode?.links?.next) {
      selectNode(currentNode.links.next)
    }
  }, [currentNode, selectNode])

  // 刷新数据
  const refresh = useCallback(() => {
    if (nodeIdFromUrl) {
      // 强制重新加载
      setCurrentNode(null)
      setNextNode(null)
      setChapterNodes([])
    }
  }, [nodeIdFromUrl])

  return {
    // 状态
    work,
    currentNode,
    nextNode,
    chapterNodes,
    places,
    isLoading,
    error,
    // 操作
    selectNode,
    goToPrev,
    goToNext,
    refresh,
  }
}

/**
 * 根据地点 ID 列表获取地点详情
 */
export function usePlaceDetails(placeIds: string[], places: Place[]): Place[] {
  return useMemo(() => {
    return placeIds
      .map((id) => places.find((p) => p.id === id))
      .filter((p): p is Place => p !== undefined)
  }, [placeIds, places])
}
