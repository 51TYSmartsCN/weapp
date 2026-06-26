import { allCourses, hotCourses, categories } from '../data'
import type { Course } from '../types'
import { Category, CATEGORY_TAG } from '../types'
import type { RequestOptions } from './config'
import { shouldUseLocal } from './config'

/** 获取热门课程列表 */
export async function getHotCourses(options?: RequestOptions): Promise<Course[]> {
  if (shouldUseLocal(options)) return hotCourses
  // TODO: return Taro.request({ url: '/api/courses/hot' })
  return hotCourses
}

/** 获取全部课程列表 */
export async function getAllCourses(options?: RequestOptions): Promise<Course[]> {
  if (shouldUseLocal(options)) return allCourses
  // TODO: return Taro.request({ url: '/api/courses' })
  return allCourses
}

/** 根据 ID 获取课程详情 */
export async function getCourseById(id: number, options?: RequestOptions): Promise<Course | undefined> {
  if (shouldUseLocal(options)) return allCourses.find((c) => c.id === id)
  // TODO: return Taro.request({ url: `/api/courses/${id}` })
  return allCourses.find((c) => c.id === id)
}

/** 获取课程分类列表（枚举值） */
export async function getCategories(options?: RequestOptions): Promise<Category[]> {
  if (shouldUseLocal(options)) return categories
  // TODO: return Taro.request({ url: '/api/categories' })
  return categories
}

/** 按分类筛选课程 */
export async function getCoursesByCategory(category: Category, options?: RequestOptions): Promise<Course[]> {
  const tagFilter = CATEGORY_TAG[category]
  // All → 不过滤
  if (tagFilter === null) return allCourses
  if (shouldUseLocal(options)) {
    return allCourses.filter((c) => c.tags?.includes(tagFilter))
  }
  // TODO: return Taro.request({ url: `/api/courses?category=${category}` })
  return allCourses.filter((c) => c.tags?.includes(tagFilter))
}