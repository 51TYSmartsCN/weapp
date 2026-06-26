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