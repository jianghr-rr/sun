/**
 * 高德地图 Web 服务 API 工具
 */

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || ''

export interface RoutePoint {
  lng: number
  lat: number
}

export interface RouteResult {
  distance: number // 距离（米）
  duration: number // 时间（秒）
  path: RoutePoint[] // 路径点
}

/**
 * 获取驾车路线规划
 * @param origin 起点 { lng, lat }
 * @param destination 终点 { lng, lat }
 */
export async function getDrivingRoute(
  origin: RoutePoint,
  destination: RoutePoint
): Promise<RouteResult | null> {
  const url = new URL('https://restapi.amap.com/v3/direction/driving')
  url.searchParams.set('key', AMAP_KEY)
  url.searchParams.set('origin', `${origin.lng},${origin.lat}`)
  url.searchParams.set('destination', `${destination.lng},${destination.lat}`)
  url.searchParams.set('extensions', 'base')

  try {
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== '1' || !data.route?.paths?.length) {
      console.error('高德路线规划失败:', data)
      return null
    }

    const route = data.route.paths[0]
    const path: RoutePoint[] = []

    // 解析每个 step 的 polyline
    for (const step of route.steps) {
      const points = step.polyline.split(';')
      for (const point of points) {
        const [lng, lat] = point.split(',').map(Number)
        if (!isNaN(lng) && !isNaN(lat)) {
          path.push({ lng, lat })
        }
      }
    }

    return {
      distance: parseInt(route.distance, 10),
      duration: parseInt(route.duration, 10),
      path,
    }
  } catch (error) {
    console.error('高德路线规划请求失败:', error)
    return null
  }
}

