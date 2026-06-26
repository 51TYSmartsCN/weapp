export { apiConfig, shouldUseLocal } from './config'
export type { RequestOptions } from './config'

export { request, showApiError, ApiException } from './request'
export type { ApiResponse } from './request'

export {
  getHotCourses,
  getAllCourses,
  getCourseById,
  getCategories,
  getCoursesByCategory,
} from './course'

export { getInstructors, getInstructorById } from './instructor'
export { getLessons, getLessonById } from './lesson'
export { getReviews } from './review'
export { getUser, menuGroups } from './user'