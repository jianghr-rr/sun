/**
 * 叙事数据加载工具
 * 用于加载作品索引、节点数据、地点库
 */

import type { Work, Volume, ChapterMeta, Node, Place, PlacesData } from '../types/narrative'
import type { NodeSummary, NodeFull } from '../types/narrative'
import { mdxWork, mdxNodeSummariesById, mdxChapterNodeIds } from './mdx-index'
import { loadNodeFullById } from './mdx-node-loaders'

// 数据基础路径
const DATA_BASE_PATH = '/data/mao-dazhuan'
const NODE_CACHE_LIMIT = 80

// 缓存
const cache: {
  places: Place[] | null
  chapters: Map<string, { chapter: ChapterMeta; nodes: NodeSummary[] }>
  nodeFulls: Map<string, NodeFull>
  pendingNodeLoads: Map<string, Promise<NodeFull | undefined>>
} = {
  places: null,
  chapters: new Map(),
  nodeFulls: new Map(),
  pendingNodeLoads: new Map(),
}

/**
 * 加载作品索引
 */
/**
 * 加载地点库
 */
export async function loadPlaces(): Promise<Place[]> {
  if (cache.places) {
    return cache.places
  }

  const response = await fetch(`${DATA_BASE_PATH}/geo/places.json`)
  if (!response.ok) {
    throw new Error(`Failed to load places: ${response.status}`)
  }

  const data: PlacesData = await response.json()
  cache.places = data.places
  return data.places
}

/**
 * 根据 ID 获取地点
 */
export async function getPlaceById(placeId: string): Promise<Place | undefined> {
  const places = await loadPlaces()
  return places.find((p) => p.id === placeId)
}

/**
 * 加载章节节点数据
 * @param volumeNumber 卷号（如 1）
 * @param chapterNumber 章号（如 0 表示引子，1 表示第1章）
 */
export async function loadChapterNodes(
  volumeNumber: number,
  chapterNumber: number
): Promise<{ chapter: ChapterMeta; nodes: NodeSummary[] }> {
  const cacheKey = `v${volumeNumber.toString().padStart(2, '0')}-c${chapterNumber.toString().padStart(2, '0')}`

  if (cache.chapters.has(cacheKey)) {
    return cache.chapters.get(cacheKey)!
  }

  const chapterId = `v${volumeNumber.toString().padStart(2, '0')}-c${chapterNumber.toString().padStart(2, '0')}`
  const nodeIds = mdxChapterNodeIds[chapterId] || []
  const nodes = nodeIds.map((id) => mdxNodeSummariesById[id]).filter(Boolean)
  const chapter = getChapterMeta(volumeNumber, chapterNumber)
  if (!chapter) {
    throw new Error(`Chapter not found: ${chapterId}`)
  }
  const result = { chapter, nodes }

  cache.chapters.set(cacheKey, result)
  return result
}

/**
 * 根据节点 ID 获取节点数据
 * 节点 ID 格式：V01-C01-P0001
 */
export async function getNodeSummaryById(nodeId: string): Promise<NodeSummary | undefined> {
  return mdxNodeSummariesById[nodeId]
}

/**
 * 按需加载完整节点（含 MDX 正文组件）
 */
export async function getNodeById(nodeId: string): Promise<Node | undefined> {
  const cached = getCachedNode(nodeId)
  if (cached) {
    return cached
  }

  const node = await loadNodeByIdInternal(nodeId)
  if (!node) return undefined
  return node
}

/**
 * 空闲时预取节点正文（不影响当前 UI）
 */
export async function prefetchNodeById(nodeId: string): Promise<void> {
  const cached = getCachedNode(nodeId)
  if (cached) return
  await loadNodeByIdInternal(nodeId)
}

/**
 * 获取作品结构（用于目录）
 */
export async function getWorkStructure(): Promise<Work> {
  return mdxWork
}

/**
 * 获取卷列表
 */
export async function getVolumes(): Promise<Volume[]> {
  const work = await getWorkStructure()
  return work.volumes
}

/**
 * 获取指定卷的章列表
 */
export async function getChapters(volumeNumber: number): Promise<ChapterMeta[]> {
  const work = await getWorkStructure()
  const volume = work.volumes.find((v) => v.number === volumeNumber)
  return volume?.chapters || []
}

/**
 * 获取第一个节点 ID（用于默认显示）
 */
export async function getFirstNodeId(): Promise<string | null> {
  if (mdxWork.volumes.length === 0) return null
  const firstVolume = mdxWork.volumes[0]
  if (firstVolume.chapters.length === 0) return null
  const firstChapter = firstVolume.chapters[0]
  const chapterId = `v${firstVolume.number.toString().padStart(2, '0')}-c${firstChapter.number.toString().padStart(2, '0')}`
  const nodeIds = mdxChapterNodeIds[chapterId] || []
  return nodeIds[0] || null
}

/**
 * 获取节点的上一个/下一个节点 ID
 */
export function getAdjacentNodeIds(node: Node): {
  prev: string | null
  next: string | null
} {
  return {
    prev: node.links?.prev || null,
    next: node.links?.next || null,
  }
}

/**
 * 清除缓存（用于开发调试）
 */
export function clearCache(): void {
  cache.places = null
  cache.chapters.clear()
  cache.nodeFulls.clear()
  cache.pendingNodeLoads.clear()
}

function getChapterMeta(
  volumeNumber: number,
  chapterNumber: number
): ChapterMeta | null {
  const volume = mdxWork.volumes.find((v) => v.number === volumeNumber)
  if (!volume) return null
  return volume.chapters.find((c) => c.number === chapterNumber) || null
}

function getCachedNode(nodeId: string): NodeFull | undefined {
  const cached = cache.nodeFulls.get(nodeId)
  if (!cached) return undefined
  // LRU: 命中时刷新顺序
  cache.nodeFulls.delete(nodeId)
  cache.nodeFulls.set(nodeId, cached)
  return cached
}

async function loadNodeByIdInternal(nodeId: string): Promise<NodeFull | undefined> {
  const pending = cache.pendingNodeLoads.get(nodeId)
  if (pending) {
    return pending
  }

  const loading = (async () => {
    const node = await loadNodeFullById(nodeId)
    if (!node) return undefined
    cache.nodeFulls.set(nodeId, node)

    // LRU: 超限时淘汰最久未访问节点
    while (cache.nodeFulls.size > NODE_CACHE_LIMIT) {
      const oldest = cache.nodeFulls.keys().next().value as string | undefined
      if (!oldest) break
      cache.nodeFulls.delete(oldest)
    }
    return node
  })()

  cache.pendingNodeLoads.set(nodeId, loading)
  try {
    return await loading
  } finally {
    cache.pendingNodeLoads.delete(nodeId)
  }
}

