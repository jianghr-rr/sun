'use client'

/**
 * 阅读器页面
 * 集成地图 + 目录 + 正文阅读区
 */

import { Suspense } from 'react'
import { ReaderLayout } from './ReaderLayout'

export function ReaderPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReaderLayout />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="w-full h-screen bg-paper-950 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="h-6 w-32 bg-paper-700/50 rounded-md mx-auto mb-4" />
        <div className="h-4 w-48 bg-paper-700/30 rounded mx-auto" />
      </div>
    </div>
  )
}
