'use client'

/**
 * 目录组件
 * 显示卷/章/节点的树形结构，支持折叠与节点选择
 */

import { useState, useEffect } from 'react'
import type { Work, Volume, ChapterMeta, Node } from '../types/narrative'
import { loadChapterNodes } from '../lib/narrative'

interface TableOfContentsProps {
  work: Work | null
  currentNodeId: string | null
  onSelectNode: (nodeId: string) => void
  isLoading?: boolean
}

export function TableOfContents({
  work,
  currentNodeId,
  onSelectNode,
  isLoading,
}: TableOfContentsProps) {
  // 展开状态：记录展开的卷和章
  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  // 章节节点缓存
  const [chapterNodesCache, setChapterNodesCache] = useState<
    Map<string, Node[]>
  >(new Map())

  // 当前节点变化时，自动展开对应的卷和章
  useEffect(() => {
    if (!currentNodeId || !work) return

    // 解析节点 ID: V01-C01-P0001
    const match = currentNodeId.match(/^V(\d+)-C(\d+)-P\d+$/)
    if (!match) return

    const volumeNumber = parseInt(match[1], 10)
    const chapterNumber = parseInt(match[2], 10)

    const volume = work.volumes.find((v) => v.number === volumeNumber)
    if (!volume) return

    const chapter = volume.chapters.find((c) => c.number === chapterNumber)
    if (!chapter) return

    // 展开卷和章
    setExpandedVolumes((prev) => new Set(prev).add(volume.id))
    setExpandedChapters((prev) => new Set(prev).add(chapter.id))

    // 加载章节节点
    loadChapterNodesForToc(volumeNumber, chapterNumber, chapter.id)
  }, [currentNodeId, work])

  // 加载章节节点（用于目录显示）
  const loadChapterNodesForToc = async (
    volumeNumber: number,
    chapterNumber: number,
    chapterId: string
  ) => {
    if (chapterNodesCache.has(chapterId)) return

    try {
      const { nodes } = await loadChapterNodes(volumeNumber, chapterNumber)
      setChapterNodesCache((prev) => new Map(prev).set(chapterId, nodes))
    } catch (err) {
      console.error('Failed to load chapter nodes:', err)
    }
  }

  // 切换卷展开状态
  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(volumeId)) {
        next.delete(volumeId)
      } else {
        next.add(volumeId)
      }
      return next
    })
  }

  // 切换章展开状态
  const toggleChapter = (
    chapterId: string,
    volumeNumber: number,
    chapterNumber: number
  ) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
        // 加载章节节点
        loadChapterNodesForToc(volumeNumber, chapterNumber, chapterId)
      }
      return next
    })
  }

  if (!work) {
    return (
      <div className="p-4 text-paper-400">
        {isLoading ? '加载中...' : '暂无数据'}
      </div>
    )
  }

  return (
    <nav className="toc overflow-y-auto h-full font-sans px-5 py-6">
      {/* 作品标题 */}
      <div className="pb-4 mb-3 border-b border-paper-700/50">
        <h2 className="text-lg font-semibold text-paper-100">{work.title}</h2>
        {work.author && (
          <p className="text-sm text-paper-400 mt-1.5">{work.author}</p>
        )}
      </div>

      {/* 卷列表 */}
      <div className="py-2">
        {work.volumes.map((volume) => (
          <VolumeItem
            key={volume.id}
            volume={volume}
            isExpanded={expandedVolumes.has(volume.id)}
            expandedChapters={expandedChapters}
            chapterNodesCache={chapterNodesCache}
            currentNodeId={currentNodeId}
            onToggleVolume={() => toggleVolume(volume.id)}
            onToggleChapter={(chapterId, chapterNumber) =>
              toggleChapter(chapterId, volume.number, chapterNumber)
            }
            onSelectNode={onSelectNode}
          />
        ))}
      </div>
    </nav>
  )
}

// 卷组件
interface VolumeItemProps {
  volume: Volume
  isExpanded: boolean
  expandedChapters: Set<string>
  chapterNodesCache: Map<string, Node[]>
  currentNodeId: string | null
  onToggleVolume: () => void
  onToggleChapter: (chapterId: string, chapterNumber: number) => void
  onSelectNode: (nodeId: string) => void
}

function VolumeItem({
  volume,
  isExpanded,
  expandedChapters,
  chapterNodesCache,
  currentNodeId,
  onToggleVolume,
  onToggleChapter,
  onSelectNode,
}: VolumeItemProps) {
  return (
    <div className="volume">
      {/* 卷标题 */}
      <button
        onClick={onToggleVolume}
        className="w-full px-2 py-3 flex items-center gap-2.5 hover:bg-paper-800/60 transition-colors text-left group rounded-lg"
      >
        <span
          className={`text-paper-500 text-xs transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
        <span className="font-medium text-paper-200 group-hover:text-paper-100">
          第{volume.number}卷 {volume.title}
        </span>
      </button>

      {/* 章列表 */}
      {isExpanded && (
        <div className="ml-4 mt-1">
          {volume.chapters.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              volumeNumber={volume.number}
              isExpanded={expandedChapters.has(chapter.id)}
              nodes={chapterNodesCache.get(chapter.id) || []}
              currentNodeId={currentNodeId}
              onToggle={() => onToggleChapter(chapter.id, chapter.number)}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 章组件
interface ChapterItemProps {
  chapter: ChapterMeta
  volumeNumber: number
  isExpanded: boolean
  nodes: Node[]
  currentNodeId: string | null
  onToggle: () => void
  onSelectNode: (nodeId: string) => void
}

function ChapterItem({
  chapter,
  volumeNumber,
  isExpanded,
  nodes,
  currentNodeId,
  onToggle,
  onSelectNode,
}: ChapterItemProps) {
  const chapterTitle =
    chapter.number === 0 ? chapter.title : `第${chapter.number}章 ${chapter.title}`

  return (
    <div className="chapter">
      {/* 章标题 */}
      <button
        onClick={onToggle}
        className="w-full px-2 py-2.5 flex items-center gap-2 hover:bg-paper-800/60 transition-colors text-left text-sm group rounded-lg"
      >
        <span
          className={`text-paper-500 text-xs transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
        <span className="text-paper-300 group-hover:text-paper-200 flex-1">{chapterTitle}</span>
        <span className="text-paper-600 text-xs">{chapter.nodeCount}</span>
      </button>

      {/* 节点列表 */}
      {isExpanded && nodes.length > 0 && (
        <div className="ml-4 mt-1 border-l border-paper-700/50">
          {nodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node}
              isActive={node.id === currentNodeId}
              onSelect={() => onSelectNode(node.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 节点组件
interface NodeItemProps {
  node: Node
  isActive: boolean
  onSelect: () => void
}

function NodeItem({ node, isActive, onSelect }: NodeItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full px-3 py-2.5 text-left text-sm transition-all ${
        isActive
          ? 'bg-accent-500/15 text-accent-400 border-l-2 border-accent-500 -ml-px'
          : 'text-paper-400 hover:bg-paper-800/50 hover:text-paper-200'
      }`}
    >
      <span className="line-clamp-1">{node.title}</span>
      {node.time?.display && (
        <span className="text-xs text-paper-500 ml-2">{node.time.display}</span>
      )}
    </button>
  )
}
