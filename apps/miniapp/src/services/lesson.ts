import { lessons } from '../data'
import type { Lesson, LessonPlayUrl, LessonProgress, ReportProgressPayload, LessonContent } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { request } from './request'

/** 获取课时列表；传入 courseId 走课程大纲接口，否则获取全部课时
 * 注意:后端不返回 videoUrl 和 content,需单独调用 getLessonPlayUrl / getLessonContent 获取
 */
export async function getLessons(courseId?: number, options?: RequestOptions): Promise<Lesson[]> {
  if (shouldUseLocal(options)) {
    if (courseId != null) return lessons.filter((lesson) => (lesson.courseId ?? 1) === courseId)
    return lessons
  }
  if (courseId != null) {
    // TODO: return Taro.request({ url: `/api/courses/${courseId}/lessons` })
    return request<Lesson[]>({ url: `/api/courses/${courseId}/lessons`, method: 'GET', skipAuth: true })
  }
  // TODO: return Taro.request({ url: '/api/lessons' })
  return request<Lesson[]>({ url: '/api/lessons', method: 'GET', skipAuth: true })
}

/** 获取单个课时(不含 videoUrl,不含 content) */
export async function getLessonById(id: number, options?: RequestOptions): Promise<Lesson | undefined> {
  if (shouldUseLocal(options)) return lessons.find((l) => l.id === id)
  // TODO: return Taro.request({ url: `/api/lessons/${id}` })
  return request<Lesson | undefined>({ url: `/api/lessons/${id}`, method: 'GET', skipAuth: true })
}

/**
 * 获取课时播放地址(鉴权后下发)
 * - 免费课/开放课: 未登录也可看
 * - 课程免费(price=0)→ 返回 videoUrl
 * - 课程付费 → 用户已购才返回,否则抛 403 ApiException
 * - videoUrl 为带签名的临时 URL，2 小时内有效
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
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    }
  }
  // TODO: return Taro.request({ url: `/api/lessons/${lessonId}/play })
  return request<LessonPlayUrl>({
    url: `/api/lessons/${lessonId}/play`,
    method: 'GET',
    authMode: 'optional',
  })
}

/**
 * 获取课时图文内容(鉴权后下发)
 * - 免费课/开放课: 未登录也可看
 * - 付费课: 需已购才返回,否则抛 403 ApiException
 */
export async function getLessonContent(lessonId: number, options?: RequestOptions): Promise<LessonContent> {
  if (shouldUseLocal(options)) {
    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) throw new Error('课时不存在')
    return {
      lessonId,
      courseId: lesson.courseId ?? 0,
      content: lesson.content ?? '',
    }
  }
  // TODO: return Taro.request({ url: `/api/lessons/${lessonId}/content` })
  return request<LessonContent>({
    url: `/api/lessons/${lessonId}/content`,
    method: 'GET',
    authMode: 'optional',
  })
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
