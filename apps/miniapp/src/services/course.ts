import { allCourses, hotCourses, categories } from '../data'
import type { Course, CourseAccess } from '../types'
import { Category, CATEGORY_TAG } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'
import { ApiException, request } from './request'

/** 获取热门课程列表 */
export async function getHotCourses(options?: RequestOptions): Promise<Course[]> {
  if (shouldUseLocal(options)) return hotCourses
  // TODO: return Taro.request({ url: '/api/courses?hot=1' })
  return request<Course[]>({ url: '/api/courses', method: 'GET', data: { hot: 1 }, skipAuth: true })
}

/** 获取全部课程列表（支持可选分页参数） */
export async function getAllCourses(
  options?: RequestOptions & { page?: number; size?: number }
): Promise<Course[]> {
  if (shouldUseLocal(options)) return allCourses
  const { page, size } = options || {}
  const data: Record<string, number> = {}
  if (page != null) data.page = page
  if (size != null) data.size = size
  // TODO: return Taro.request({ url: '/api/courses' })
  return request<Course[]>({ url: '/api/courses', method: 'GET', data, skipAuth: true })
}

/** 根据 ID 获取课程详情 */
export async function getCourseById(id: number, options?: RequestOptions): Promise<Course | undefined> {
  if (shouldUseLocal(options)) return allCourses.find((c) => c.id === id)
  // TODO: return Taro.request({ url: `/api/courses/${id}` })
  return request<Course | undefined>({ url: `/api/courses/${id}`, method: 'GET', skipAuth: true })
}

/** 获取课程分类列表（枚举值） */
export async function getCategories(options?: RequestOptions): Promise<Category[]> {
  if (shouldUseLocal(options)) return categories
  // TODO: return Taro.request({ url: '/api/categories' })
  const rows = await request<{ code: string }[]>({ url: '/api/categories', method: 'GET', skipAuth: true })
  // 后端返回 [{id, code, name, sort}]，前端只需 code 字段并映射为 Category 枚举
  return rows.map((r) => r.code as Category)
}

/** 按分类筛选课程 */
export async function getCoursesByCategory(category: Category, options?: RequestOptions): Promise<Course[]> {
  const tagFilter = CATEGORY_TAG[category]
  if (shouldUseLocal(options)) {
    // All → 不过滤
    if (tagFilter === null) return allCourses
    return allCourses.filter((c) => c.tags?.includes(tagFilter))
  }
  // All → 不过滤，直接调全部课程接口
  if (tagFilter === null) {
    return request<Course[]>({ url: '/api/courses', method: 'GET', skipAuth: true })
  }
  // TODO: return Taro.request({ url: `/api/courses?category=${category}` })
  return request<Course[]>({ url: '/api/courses', method: 'GET', data: { category }, skipAuth: true })
}

/**
 * 查询当前用户对该课程的访问权限
 * - 免费课程(price=0):canLearn=true
 * - VIP 用户:canLearn=true
 * - 付费课程:用户在 user_courses 中存在记录 → canLearn=true
 * - 未登录场景:仅免费课 canLearn=true
 *
 * 本地 mock:price=0 或 isVip=true 即可学
 */
export async function getCourseAccess(courseId: number, options?: RequestOptions): Promise<CourseAccess> {
  if (shouldUseLocal(options)) {
    const course = allCourses.find((c) => c.id === courseId)
    const isFree = !course || course.price === 0
    // 本地 mock 假设当前用户不是 VIP（真实 VIP 状态需后端接口返回）
    return { courseId, isFree, purchased: isFree, canLearn: isFree, isVip: false }
  }
  try {
    return await request<CourseAccess>({
      url: `/api/courses/${courseId}/access`,
      method: 'GET',
      authMode: 'optional',
    })
  } catch (err) {
    if (err instanceof ApiException && err.code === 401) {
      const course = await getCourseById(courseId, { local: false })
      const isFree = !course || course.price === 0
      return { courseId, isFree, purchased: isFree, canLearn: isFree, isVip: false }
    }
    throw err
  }
}
