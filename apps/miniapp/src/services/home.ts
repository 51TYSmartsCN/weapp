import { homeStats } from '../data'
import type { HomeStatItem } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取首页统计卡片配置 */
export async function getHomeStats(options?: RequestOptions): Promise<HomeStatItem[]> {
  if (shouldUseLocal(options)) return homeStats
  // TODO: return Taro.request({ url: '/api/app-configs/home-stats' })
  return request<HomeStatItem[]>({
    url: '/api/app-configs/home-stats',
    method: 'GET',
    skipAuth: true,
  })
}
