import { lessons } from '../data'
import type { Lesson } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

/** 获取课程大纲（课时列表） */
export async function getLessons(options?: RequestOptions): Promise<Lesson[]> {
  if (shouldUseLocal(options)) return lessons
  // TODO: return Taro.request({ url: '/api/lessons' })
  return lessons
}

/** 获取单个课时 */
export async function getLessonById(id: number, options?: RequestOptions): Promise<Lesson | undefined> {
  if (shouldUseLocal(options)) return lessons.find((l) => l.id === id)
  // TODO: return Taro.request({ url: `/api/lessons/${id}` })
  return lessons.find((l) => l.id === id)
}
