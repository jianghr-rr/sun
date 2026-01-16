/**
 * 《毛泽东大传》联动地图 - 数据类型定义
 *
 * 核心概念：
 * - Work: 作品（如《毛泽东大传》）
 * - Volume: 卷
 * - Chapter: 章
 * - Node: 叙事节点（最小联动单元）
 * - Place/Region/Route: 地理要素
 */

// ============================================
// 作品结构
// ============================================

/** 作品 */
export interface Work {
  id: string
  title: string
  subtitle?: string
  author?: string
  description?: string
  volumes: Volume[]
}

/** 卷 */
export interface Volume {
  id: string
  number: number
  title: string
  subtitle?: string
  chapters: ChapterMeta[]
}

/** 章元信息（用于目录索引，不含完整节点数据） */
export interface ChapterMeta {
  id: string
  number: number
  title: string
  nodeCount: number
  /** 节点数据文件路径（相对于 data 目录） */
  nodesRef: string
}

/** 章完整数据（包含所有节点） */
export interface Chapter extends ChapterMeta {
  nodes: Node[]
}

// ============================================
// 叙事节点（核心）
// ============================================

/** 叙事节点 - 最小联动单元 */
export interface Node {
  id: string
  workId: string
  volume: number
  chapter: number
  /** 节点标题 */
  title: string
  /** 时间范围（可选） */
  time?: TimeRange
  /** 正文内容引用 */
  content: ContentRef
  /** 地图配置 */
  map: MapConfig
  /** 场景过渡配置 */
  transitions?: TransitionConfig
  /** 前后节点链接 */
  links?: NodeLinks
  /** 引用来源 */
  sources?: Source[]
}

/** 时间范围 */
export interface TimeRange {
  start?: string // ISO 8601 日期字符串
  end?: string
  /** 精度：year | month | day */
  precision?: 'year' | 'month' | 'day'
  /** 显示文本（如"1893年"） */
  display?: string
}

/** 正文内容引用 */
export interface ContentRef {
  /** 格式：md | mdx | text */
  format: 'md' | 'mdx' | 'text'
  /** 引用路径（如 "mao-dazhuan/content/v01/c01.md#P0001"） */
  ref: string
  /** 内联正文（小段落可直接内嵌，大段落用 ref） */
  inline?: string
}

/** 地图配置 */
export interface MapConfig {
  /** 关联的地图要素 */
  features: FeatureRef[]
  /** 迁移路线（可选） */
  route?: RouteRef | null
  /** 镜头配置 */
  camera: CameraConfig
}

/** 地图要素引用 */
export interface FeatureRef {
  /** 要素类型 */
  type: 'place' | 'region'
  /** 地点 ID（引用 places.json） */
  placeId?: string
  /** 区域 ID（引用 regions/*.geojson） */
  regionId?: string
  /** 显示标签（覆盖默认名称） */
  label?: string
  /** 角色：primary=主要地点, context=背景/上下文 */
  role?: 'primary' | 'context'
}

/** 路线引用 */
export interface RouteRef {
  /** 路线 ID（引用 routes/*.json） */
  routeId?: string
  /** 起点地点 ID */
  from: string
  /** 终点地点 ID */
  to: string
  /** 途经点（可选） */
  via?: string[]
  /** 路线来源：amap=高德API, manual=手工标注 */
  source?: 'amap' | 'manual'
}

/** 镜头配置 */
export interface CameraConfig {
  /** 镜头模式 */
  mode: 'autoFit' | 'preset' | 'followRoute'
  /** autoFit 模式：边距比例 */
  padding?: number
  /** preset 模式：经度 */
  lng?: number
  /** preset 模式：纬度 */
  lat?: number
  /** preset 模式：高度（米） */
  height?: number
  /** preset 模式：航向角（度） */
  heading?: number
  /** preset 模式：俯仰角（度） */
  pitch?: number
  /** 飞行动画时长（毫秒） */
  durationMs?: number
}

/** 场景过渡配置 */
export interface TransitionConfig {
  /** 进入动画 */
  enter?: {
    fadeMs?: number
    flyToMs?: number
  }
  /** 退出动画 */
  exit?: {
    fadeMs?: number
  }
}

/** 前后节点链接 */
export interface NodeLinks {
  prev?: string
  next?: string
}

/** 引用来源 */
export interface Source {
  type: 'book' | 'article' | 'archive' | 'website'
  title: string
  author?: string
  loc?: string // 位置/页码
  url?: string
}

// ============================================
// 地理数据
// ============================================

/** 地点（点位） */
export interface Place {
  id: string
  /** 地点名称 */
  name: string
  /** 别名 */
  aliases?: string[]
  /** 坐标 */
  coord: {
    lng: number
    lat: number
  }
  /** 行政级别 */
  level?: 'province' | 'city' | 'county' | 'town' | 'village' | 'poi'
  /** 备注 */
  notes?: string
  /** 数据来源 */
  source?: {
    type: 'amap' | 'manual' | 'historical'
    by?: string
    date?: string
  }
}

/** 地点库 */
export interface PlacesData {
  version: string
  updatedAt: string
  places: Place[]
}

/** 区域（多边形） - 使用标准 GeoJSON Feature */
export interface RegionFeature {
  type: 'Feature'
  properties: {
    id: string
    name: string
    level?: string
    notes?: string
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

/** 路线数据 */
export interface Route {
  id: string
  /** 起点地点 ID */
  from: string
  /** 终点地点 ID */
  to: string
  /** 交通方式 */
  mode?: 'driving' | 'walking' | 'transit'
  /** 路线坐标点 [lng, lat][] */
  points: [number, number][]
  /** 元信息 */
  meta?: {
    distanceM?: number
    durationS?: number
  }
  /** 数据来源 */
  source: {
    type: 'amap' | 'manual'
    cachedAt?: string
  }
}

// ============================================
// 作品索引（index.json 结构）
// ============================================

/** 作品索引文件结构 */
export interface WorkIndex {
  work: Work
  meta: {
    version: string
    updatedAt: string
    totalNodes: number
    totalPlaces: number
  }
}

