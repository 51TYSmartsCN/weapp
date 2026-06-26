import type { Favorite } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 切换收藏状态：返回 true 表示已收藏，false 表示已取消 */
export async function toggleFavorite(courseId: number, options?: RequestOptions): Promise<boolean> {
  if (shouldUseLocal(options)) return true
  // TODO: return Taro.request({ url: '/api/favorites', method: 'POST', data: { courseId } })
  return request<boolean>({ url: '/api/favorites', method: 'POST', data: { courseId } })
}

/** 检查某课程是否已收藏 */
export async function checkFavorite(courseId: number, options?: RequestOptions): Promise<boolean> {
  if (shouldUseLocal(options)) return false
  // TODO: return Taro.request({ url: `/api/favorites/check?course_id=${courseId}` })
  return request<boolean>({ url: '/api/favorites/check', method: 'GET', data: { course_id: courseId } })
}

/** 获取当前用户收藏列表 */
export async function getMyFavorites(options?: RequestOptions): Promise<Favorite[]> {
  if (shouldUseLocal(options)) return []
  // TODO: return Taro.request({ url: '/api/favorites' })
  return request<Favorite[]>({ url: '/api/favorites', method: 'GET' })
}
