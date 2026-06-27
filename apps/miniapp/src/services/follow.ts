import type { Follow } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 切换关注状态：返回 true 表示已关注，false 表示已取消 */
export async function toggleFollow(instructorId: number, options?: RequestOptions): Promise<boolean> {
  if (shouldUseLocal(options)) return true
  // TODO: return Taro.request({ url: '/api/follows', method: 'POST', data: { instructorId } })
  return request<boolean>({ url: '/api/follows', method: 'POST', data: { instructorId } })
}

/** 检查是否已关注某讲师 */
export async function checkFollow(instructorId: number, options?: RequestOptions): Promise<boolean> {
  if (shouldUseLocal(options)) return false
  // TODO: return Taro.request({ url: `/api/follows/check?instructor_id=${instructorId}` })
  return request<boolean>({ url: '/api/follows/check', method: 'GET', data: { instructor_id: instructorId } })
}

/** 获取当前用户关注列表 */
export async function getMyFollows(options?: RequestOptions): Promise<Follow[]> {
  if (shouldUseLocal(options)) return []
  // TODO: return Taro.request({ url: '/api/follows' })
  return request<Follow[]>({ url: '/api/follows', method: 'GET' })
}
