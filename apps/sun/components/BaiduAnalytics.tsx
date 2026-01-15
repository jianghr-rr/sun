'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// 声明全局类型
declare global {
  interface Window {
    _hmt: Array<[string, ...unknown[]]>
  }
}

const BAIDU_TONGJI_ID = process.env.NEXT_PUBLIC_BAIDU_TONGJI_ID

export function BaiduAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 初始化百度统计脚本
  useEffect(() => {
    // 如果没有配置 ID，则不加载
    if (!BAIDU_TONGJI_ID) {
      console.log('[Analytics] 未配置百度统计 ID，跳过加载')
      return
    }

    console.log('[Analytics] 加载百度统计，ID:', BAIDU_TONGJI_ID.slice(0, 6) + '...')

    // 初始化 _hmt 数组
    window._hmt = window._hmt || []

    // 动态插入统计脚本
    const script = document.createElement('script')
    script.src = `https://hm.baidu.com/hm.js?${BAIDU_TONGJI_ID}`
    script.async = true
    document.head.appendChild(script)

    return () => {
      // 组件卸载时移除脚本
      document.head.removeChild(script)
    }
  }, [])

  // 监听路由变化，上报 PV
  useEffect(() => {
    if (!BAIDU_TONGJI_ID) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')

    // 上报页面浏览
    window._hmt = window._hmt || []
    window._hmt.push(['_trackPageview', url])

    // 开发时打印调试日志
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] PV:', url)
    }
  }, [pathname, searchParams])

  return null
}

