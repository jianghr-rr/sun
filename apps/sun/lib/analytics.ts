/**
 * 百度统计工具函数
 */

declare global {
  interface Window {
    _hmt: Array<[string, ...unknown[]]>
  }
}

const isDev = process.env.NODE_ENV === 'development'

/**
 * 追踪自定义事件
 * @param category - 事件分类（如：'Button', 'Video', 'Form'）
 * @param action - 事件操作（如：'Click', 'Play', 'Submit'）
 * @param label - 事件标签（可选，如：按钮名称）
 * @param value - 事件值（可选，数字类型）
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (typeof window === 'undefined' || !window._hmt) {
    if (isDev) console.log('[Analytics] trackEvent 跳过 - _hmt 未初始化')
    return
  }

  const params: [string, string, string, string?, number?] = ['_trackEvent', category, action]
  if (label) params.push(label)
  if (value !== undefined) params.push(value)

  window._hmt.push(params)

  // 开发环境打印调试日志
  if (isDev) {
    console.log('[Analytics] Event:', { category, action, label, value })
  }
}

/**
 * 手动上报页面浏览（用于特殊场景）
 * @param url - 页面路径
 */
export function trackPageview(url: string) {
  if (typeof window === 'undefined' || !window._hmt) {
    if (isDev) console.log('[Analytics] trackPageview 跳过 - _hmt 未初始化')
    return
  }

  window._hmt.push(['_trackPageview', url])

  if (isDev) {
    console.log('[Analytics] Manual PV:', url)
  }
}

