'use client'

import { useCallback, useRef } from 'react'

/**
 * 百度统计 Hooks
 * 提供前端埋点的便捷方法
 */

declare global {
  interface Window {
    _hmt: Array<[string, ...unknown[]]>
  }
}

const isDev = process.env.NODE_ENV === 'development'

// ============ 基础工具函数 ============

/**
 * 检查是否可以上报（客户端 + _hmt 已初始化）
 */
function canTrack(): boolean {
  return typeof window !== 'undefined' && Array.isArray(window._hmt)
}

/**
 * 上报事件
 */
function track(params: [string, ...unknown[]]) {
  if (!canTrack()) {
    if (isDev) console.log('[Analytics] 跳过上报 - 非客户端或 _hmt 未初始化')
    return false
  }
  window._hmt.push(params)
  return true
}

// ============ 事件类型定义 ============

export type EventCategory = 
  | 'Button'      // 按钮点击
  | 'Link'        // 链接点击
  | 'Form'        // 表单操作
  | 'API'         // 接口调用
  | 'Video'       // 视频播放
  | 'Download'    // 下载
  | 'Share'       // 分享
  | 'Conversion'  // 转化
  | 'Error'       // 错误
  | string        // 自定义分类

export type EventAction = 
  | 'Click'
  | 'Submit'
  | 'Success'
  | 'Error'
  | 'Play'
  | 'Pause'
  | 'Complete'
  | 'Start'
  | 'End'
  | string

export interface TrackEventOptions {
  category: EventCategory
  action: EventAction
  label?: string
  value?: number
}

// ============ 核心上报函数 ============

/**
 * 上报自定义事件
 */
export function trackEvent(
  category: EventCategory,
  action: EventAction,
  label?: string,
  value?: number
) {
  const params: [string, string, string, string?, number?] = ['_trackEvent', category, action]
  if (label) params.push(label)
  if (value !== undefined) params.push(value)

  const success = track(params)
  
  if (isDev && success) {
    console.log('[Analytics] Event:', { category, action, label, value })
  }
}

/**
 * 上报页面浏览
 */
export function trackPageview(url: string) {
  const success = track(['_trackPageview', url])
  
  if (isDev && success) {
    console.log('[Analytics] PV:', url)
  }
}

// ============ React Hooks ============

/**
 * 主 Hook - 提供所有埋点方法
 * 
 * @example
 * ```tsx
 * const { trackEvent, trackClick, trackAPI } = useAnalytics()
 * 
 * <button onClick={trackClick('下载按钮')}>下载</button>
 * ```
 */
export function useAnalytics() {
  /**
   * 追踪点击事件
   * @param label - 点击标签
   * @param category - 分类，默认 'Button'
   */
  const trackClick = useCallback((label: string, category: EventCategory = 'Button') => {
    return () => trackEvent(category, 'Click', label)
  }, [])

  /**
   * 追踪表单提交
   * @param formName - 表单名称
   */
  const trackSubmit = useCallback((formName: string) => {
    return () => trackEvent('Form', 'Submit', formName)
  }, [])

  /**
   * 追踪 API 调用
   * @param url - 接口地址
   * @param success - 是否成功
   * @param duration - 耗时（毫秒）
   */
  const trackAPI = useCallback((url: string, success: boolean, duration?: number) => {
    trackEvent('API', success ? 'Success' : 'Error', url, duration)
  }, [])

  /**
   * 追踪错误
   * @param errorType - 错误类型
   * @param message - 错误信息
   */
  const trackError = useCallback((errorType: string, message?: string) => {
    trackEvent('Error', errorType, message)
  }, [])

  /**
   * 追踪转化
   * @param conversionType - 转化类型（如 'Register', 'Payment'）
   * @param label - 标签
   * @param value - 值（如金额）
   */
  const trackConversion = useCallback((conversionType: string, label?: string, value?: number) => {
    trackEvent('Conversion', conversionType, label, value)
  }, [])

  return {
    trackEvent,
    trackPageview,
    trackClick,
    trackSubmit,
    trackAPI,
    trackError,
    trackConversion,
  }
}

/**
 * 追踪元素曝光
 * 
 * @example
 * ```tsx
 * const ref = useTrackExposure('Banner', '首页横幅')
 * return <div ref={ref}>...</div>
 * ```
 */
export function useTrackExposure(category: EventCategory, label: string) {
  const hasTracked = useRef(false)
  
  const ref = useCallback((node: HTMLElement | null) => {
    if (!node || hasTracked.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true
            trackEvent(category, 'Exposure', label)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(node)
    
    return () => observer.disconnect()
  }, [category, label])

  return ref
}

// ============ 服务端埋点支持 ============

/**
 * 服务端埋点数据结构
 * 用于在服务端收集埋点，传递到客户端上报
 */
export interface ServerAnalyticsEvent {
  type: 'event' | 'pageview'
  category?: EventCategory
  action?: EventAction
  label?: string
  value?: number
  url?: string
  timestamp: number
}

/**
 * 创建服务端埋点事件（在 Server Component 或 Server Action 中使用）
 * 
 * @example
 * ```ts
 * // Server Action
 * async function submitForm(data: FormData) {
 *   'use server'
 *   // 处理逻辑...
 *   return {
 *     success: true,
 *     analytics: createServerEvent('Form', 'Submit', '注册表单')
 *   }
 * }
 * ```
 */
export function createServerEvent(
  category: EventCategory,
  action: EventAction,
  label?: string,
  value?: number
): ServerAnalyticsEvent {
  return {
    type: 'event',
    category,
    action,
    label,
    value,
    timestamp: Date.now(),
  }
}

/**
 * 在客户端上报服务端收集的埋点
 * 
 * @example
 * ```tsx
 * const result = await submitForm(formData)
 * if (result.analytics) {
 *   reportServerEvent(result.analytics)
 * }
 * ```
 */
export function reportServerEvent(event: ServerAnalyticsEvent) {
  if (event.type === 'event' && event.category && event.action) {
    trackEvent(event.category, event.action, event.label, event.value)
  } else if (event.type === 'pageview' && event.url) {
    trackPageview(event.url)
  }
}

/**
 * 批量上报服务端事件
 */
export function reportServerEvents(events: ServerAnalyticsEvent[]) {
  events.forEach(reportServerEvent)
}

