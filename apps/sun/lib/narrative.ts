/**
 * 叙事数据加载工具
 * 用于加载作品索引、节点数据、地点库
 */

import type {
  WorkIndex,
  Work,
  Volume,
  ChapterMeta,
  Node,
  Place,
  PlacesData,
} from '../types/narrative'

// 数据基础路径
const DATA_BASE_PATH = '/data/mao-dazhuan'

// 缓存
const cache: {
  workIndex: WorkIndex | null
  places: Place[] | null
  chapters: Map<string, { chapter: ChapterMeta; nodes: Node[] }>
} = {
  workIndex: null,
  places: null,
  chapters: new Map(),
}

/**
 * 加载作品索引
 */
export async function loadWorkIndex(): Promise<WorkIndex> {
  if (cache.workIndex) {
    return cache.workIndex
  }

  const response = await fetch(`${DATA_BASE_PATH}/index.json`)
  if (!response.ok) {
    throw new Error(`Failed to load work index: ${response.status}`)
  }

  const data: WorkIndex = await response.json()
  cache.workIndex = data
  return data
}

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
): Promise<{ chapter: ChapterMeta; nodes: Node[] }> {
  const cacheKey = `v${volumeNumber.toString().padStart(2, '0')}-c${chapterNumber.toString().padStart(2, '0')}`

  if (cache.chapters.has(cacheKey)) {
    return cache.chapters.get(cacheKey)!
  }

  const volumeId = `v${volumeNumber.toString().padStart(2, '0')}`
  const chapterId = `c${chapterNumber.toString().padStart(2, '0')}`
  const path = `${DATA_BASE_PATH}/nodes/${volumeId}/${chapterId}.json`

  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to load chapter nodes: ${response.status}`)
  }

  const data = await response.json()
  const result = {
    chapter: data.chapter as ChapterMeta,
    nodes: data.nodes as Node[],
  }

  cache.chapters.set(cacheKey, result)
  return result
}

/**
 * 根据节点 ID 获取节点数据
 * 节点 ID 格式：V01-C01-P0001
 */
export async function getNodeById(nodeId: string): Promise<Node | undefined> {
  // 解析节点 ID
  const match = nodeId.match(/^V(\d+)-C(\d+)-P\d+$/)
  if (!match) {
    console.error(`Invalid node ID format: ${nodeId}`)
    return undefined
  }

  const volumeNumber = parseInt(match[1], 10)
  const chapterNumber = parseInt(match[2], 10)

  const { nodes } = await loadChapterNodes(volumeNumber, chapterNumber)
  return nodes.find((n) => n.id === nodeId)
}

/**
 * 获取作品结构（用于目录）
 */
export async function getWorkStructure(): Promise<Work> {
  const { work } = await loadWorkIndex()
  return work
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
  const work = await getWorkStructure()
  if (work.volumes.length === 0) return null

  const firstVolume = work.volumes[0]
  if (firstVolume.chapters.length === 0) return null

  const firstChapter = firstVolume.chapters[0]
  const { nodes } = await loadChapterNodes(firstVolume.number, firstChapter.number)

  return nodes.length > 0 ? nodes[0].id : null
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
  cache.workIndex = null
  cache.places = null
  cache.chapters.clear()
}

