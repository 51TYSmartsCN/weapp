import { reviews } from '../data'
import type { Review } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

/** 获取学员评价列表 */
export async function getReviews(options?: RequestOptions): Promise<Review[]> {
  if (shouldUseLocal(options)) return reviews
  // TODO: return Taro.request({ url: '/api/reviews' })
  return reviews
}