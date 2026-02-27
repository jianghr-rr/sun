'use client'

import { useCallback, useMemo, useRef } from 'react'

export interface ReadingProgress {
  nodeId: string
  scrollRatio: number
  savedAt: number
}

const STORAGE_PREFIX = 'reading-progress'
const DEFAULT_THROTTLE_MS = 2000

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(1, v))
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function useReadingProgress(workId: string | undefined, throttleMs = DEFAULT_THROTTLE_MS) {
  const storageKey = useMemo(() => {
    if (!workId) return null
    return `${STORAGE_PREFIX}:${workId}`
  }, [workId])

  const lastWriteTsRef = useRef<number>(0)
  const lastWrittenRef = useRef<ReadingProgress | null>(null)
  const pendingRef = useRef<ReadingProgress | null>(null)
  const timerRef = useRef<number | null>(null)

  const load = useCallback((): ReadingProgress | null => {
    if (!storageKey) return null
    if (!isBrowser()) return null
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<ReadingProgress> | null
      if (!parsed || typeof parsed !== 'object') return null
      if (typeof parsed.nodeId !== 'string' || !parsed.nodeId) return null

      const scrollRatio = clamp01(typeof parsed.scrollRatio === 'number' ? parsed.scrollRatio : 0)
      const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0

      return { nodeId: parsed.nodeId, scrollRatio, savedAt }
    } catch {
      return null
    }
  }, [storageKey])

  const clear = useCallback(() => {
    if (!storageKey) return
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey])

  const flush = useCallback(
    (progress: ReadingProgress) => {
      if (!storageKey) return
      if (!isBrowser()) return
      try {
        const payload: ReadingProgress = {
          nodeId: progress.nodeId,
          scrollRatio: clamp01(progress.scrollRatio),
          savedAt: progress.savedAt,
        }

        const last = lastWrittenRef.current
        if (
          last &&
          last.nodeId === payload.nodeId &&
          last.scrollRatio === payload.scrollRatio
        ) {
          return
        }

        window.localStorage.setItem(storageKey, JSON.stringify(payload))
        lastWrittenRef.current = payload
        lastWriteTsRef.current = payload.savedAt
      } catch {
        // ignore
      }
    },
    [storageKey]
  )

  const save = useCallback(
    (nodeId: string, scrollRatio: number, opts?: { immediate?: boolean }) => {
      if (!storageKey) return
      if (!isBrowser()) return
      if (!nodeId) return

      const now = Date.now()
      const next: ReadingProgress = {
        nodeId,
        scrollRatio: clamp01(scrollRatio),
        savedAt: now,
      }

      if (opts?.immediate) {
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
        pendingRef.current = null
        flush(next)
        return
      }

      pendingRef.current = next

      const elapsed = now - lastWriteTsRef.current
      if (elapsed >= throttleMs) {
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
        const p = pendingRef.current
        pendingRef.current = null
        if (p) flush(p)
        return
      }

      if (timerRef.current == null) {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null
          const p = pendingRef.current
          pendingRef.current = null
          if (p) flush(p)
        }, Math.max(0, throttleMs - elapsed))
      }
    },
    [flush, storageKey, throttleMs]
  )

  return { load, save, clear }
}

