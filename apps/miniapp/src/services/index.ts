export { apiConfig, shouldUseLocal } from './config'
export type { RequestOptions } from './config'

export { request, showApiError, ApiException } from './request'
export type { ApiResponse } from './request'

export {
  login,
  logout,
  updateProfile,
  getToken,
  setToken,
  removeToken,
  isLoggedIn,
} from './auth'
export type { UpdateProfilePayload } from './auth'

export {
  getHotCourses,
  getAllCourses,
  getCourseById,
  getCategories,
  getCoursesByCategory,
  getCourseAccess,
} from './course'

export { getBanners } from './banner'

export { getInstructors, getInstructorById } from './instructor'
export { getLessons, getLessonById, getLessonPlayUrl, reportLessonProgress } from './lesson'
export { getReviews } from './review'
export { getUser, menuGroups } from './user'

export { toggleFavorite, checkFavorite, getMyFavorites } from './favorite'
export { toggleFollow, checkFollow, getMyFollows } from './follow'
export { createOrder, getOrders, getOrderById } from './order'
export { getLearningSummary, getMyCourses } from './learning'
export {
  getCoupons,
  getInvitations,
  getCertificates,
  getStudyRecords,
  createFeedback,
  getHelpArticles,
} from './profile'

export { getThemeConfigSync, fetchThemeConfig, initTheme, refreshTheme, cacheThemeConfig, applyTabBarTheme, applyTabBarIcons } from './app-config'
export type { ThemeConfig, TabItem } from './app-config'
export {
  getModuleModesSync,
  fetchModuleModes,
  cacheModuleModes,
  refreshModuleModes,
  initModuleModes,
} from './app-config'
export type { ModuleDisplayModes } from './app-config'