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
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">加载中...</p>
      </div>
    </div>
  )
}
