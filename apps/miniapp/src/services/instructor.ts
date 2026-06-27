import { instructors } from '../data'
import type { Instructor } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取所有讲师 */
export async function getInstructors(options?: RequestOptions): Promise<Instructor[]> {
  if (shouldUseLocal(options)) return instructors
  // TODO: return Taro.request({ url: '/api/instructors' })
  return request<Instructor[]>({ url: '/api/instructors', method: 'GET' })
}

/** 根据 ID 获取讲师 */
export async function getInstructorById(id: number, options?: RequestOptions): Promise<Instructor | undefined> {
  if (shouldUseLocal(options)) return instructors.find((i) => i.id === id)
  // TODO: return Taro.request({ url: `/api/instructors/${id}` })
  return request<Instructor | undefined>({ url: `/api/instructors/${id}`, method: 'GET' })
}