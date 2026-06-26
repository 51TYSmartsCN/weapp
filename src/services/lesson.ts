import { lessons } from '../data'
import type { Lesson, LessonProgress, ReportProgressPayload } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取课时列表；传入 courseId 走课程大纲接口，否则获取全部课时 */
export async function getLessons(courseId?: number, options?: RequestOptions): Promise<Lesson[]> {
  if (shouldUseLocal(options)) return lessons
  if (courseId != null) {
    // TODO: return Taro.request({ url: `/api/courses/${courseId}/lessons` })
    return request<Lesson[]>({ url: `/api/courses/${courseId}/lessons`, method: 'GET' })
  }
  // TODO: return Taro.request({ url: '/api/lessons' })
  return request<Lesson[]>({ url: '/api/lessons', method: 'GET' })
}

/** 获取单个课时 */
export async function getLessonById(id: number, options?: RequestOptions): Promise<Lesson | undefined> {
  if (shouldUseLocal(options)) return lessons.find((l) => l.id === id)
  // TODO: return Taro.request({ url: `/api/lessons/${id}` })
  return request<Lesson | undefined>({ url: `/api/lessons/${id}`, method: 'GET' })
}

/** 上报课时学习进度 */
export async function reportLessonProgress(
  lessonId: number,
  payload: ReportProgressPayload,
  options?: RequestOptions
): Promise<LessonProgress> {
  if (shouldUseLocal(options)) {
    return {
      id: Date.now(),
      userId: 0,
      lessonId,
      courseId: 0,
      completed: payload.completed,
      watchedSeconds: payload.watchedSeconds,
      lastPosition: payload.lastPosition,
      updatedAt: new Date().toISOString(),
    }
  }
  // TODO: return Taro.request({ url: `/api/lessons/${lessonId}/progress`, method: 'POST', data: payload })
  return request<LessonProgress>({
    url: `/api/lessons/${lessonId}/progress`,
    method: 'POST',
    data: payload,
  })
}
