import { lessons } from '../data'
import type { Lesson, LessonPlayUrl, LessonProgress, ReportProgressPayload } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取课时列表；传入 courseId 走课程大纲接口，否则获取全部课时
 * 注意:后端不再返回 videoUrl,需单独调用 getLessonPlayUrl 获取
 */
export async function getLessons(courseId?: number, options?: RequestOptions): Promise<Lesson[]> {
  if (shouldUseLocal(options)) return lessons
  if (courseId != null) {
    // TODO: return Taro.request({ url: `/api/courses/${courseId}/lessons` })
    return request<Lesson[]>({ url: `/api/courses/${courseId}/lessons`, method: 'GET' })
  }
  // TODO: return Taro.request({ url: '/api/lessons' })
  return request<Lesson[]>({ url: '/api/lessons', method: 'GET' })
}

/** 获取单个课时(不含 videoUrl) */
export async function getLessonById(id: number, options?: RequestOptions): Promise<Lesson | undefined> {
  if (shouldUseLocal(options)) return lessons.find((l) => l.id === id)
  // TODO: return Taro.request({ url: `/api/lessons/${id}` })
  return request<Lesson | undefined>({ url: `/api/lessons/${id}`, method: 'GET' })
}

/**
 * 获取课时播放地址(鉴权后下发)
 * - 必须登录
 * - 课程免费(price=0)→ 返回 videoUrl
 * - 课程付费 → 用户已购才返回,否则抛 403 ApiException
 *
 * 本地 mock:直接返回 lessons 数据中的 videoUrl
 */
export async function getLessonPlayUrl(lessonId: number, options?: RequestOptions): Promise<LessonPlayUrl> {
  if (shouldUseLocal(options)) {
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) throw new Error('课时不存在')
    return {
      lessonId,
      courseId: lesson.courseId ?? 0,
      videoUrl: lesson.videoUrl ?? '',
    }
  }
  // TODO: return Taro.request({ url: `/api/lessons/${lessonId}/play` })
  return request<LessonPlayUrl>({ url: `/api/lessons/${lessonId}/play`, method: 'GET' })
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
