import { instructors } from '../data'
import type { Instructor } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

/** 获取所有讲师 */
export async function getInstructors(options?: RequestOptions): Promise<Instructor[]> {
  if (shouldUseLocal(options)) return instructors
  // TODO: return Taro.request({ url: '/api/instructors' })
  return instructors
}

/** 根据 ID 获取讲师 */
export async function getInstructorById(id: number, options?: RequestOptions): Promise<Instructor | undefined> {
  if (shouldUseLocal(options)) return instructors.find((i) => i.id === id)
  // TODO: return Taro.request({ url: `/api/instructors/${id}` })
  return instructors.find((i) => i.id === id)
}