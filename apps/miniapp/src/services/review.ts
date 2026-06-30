import { reviews } from '../data'
import type { Review } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取学员评价列表 */
export async function getReviews(courseId?: number, options?: RequestOptions): Promise<Review[]> {
  if (shouldUseLocal(options)) {
    if (courseId != null) {
      return reviews.filter((r) => r.courseId === courseId)
    }
    return reviews
  }
  const data: Record<string, number> = {}
  if (courseId != null) data.course_id = courseId
  // TODO: return Taro.request({ url: '/api/reviews' })
  return request<Review[]>({ url: '/api/reviews', method: 'GET', data, skipAuth: true })
}