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
  LOGIN_PAGE_URL,
  HOME_PAGE_URL,
  LOGIN_RETURN_URL_KEY,
  sanitizeReturnUrl,
  buildReturnUrl,
  buildLoginPageUrl,
  resolveDecodedReturnUrl,
  isTabPageUrl,
} from './login-redirect'

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
export { getLessons, getLessonById, getLessonPlayUrl, getLessonContent, reportLessonProgress } from './lesson'
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

export { getThemeConfigSync, fetchThemeConfig, initTheme, refreshTheme, cacheThemeConfig, applyTabBarTheme, applyTabBarIcons, resolveColor, syncThemeColors } from './app-config'
export type { ThemeConfig, TabItem } from './app-config'
export {
  getModuleModesSync,
  fetchModuleModes,
  cacheModuleModes,
  refreshModuleModes,
  initModuleModes,
} from './app-config'
export type { ModuleDisplayModes } from './app-config'
export {
  getAppInfoSync,
  fetchAppInfo,
  cacheAppInfo,
  refreshAppInfo,
  initAppInfo,
  resolveUrl,
} from './app-config'
export type { AppInfo } from './app-config'

export {
  getWxshopProduct,
  fetchWxshopConfig,
  getWxshopConfigSync,
  initWxshopConfig,
  refreshWxshopConfig,
  getWxshopEntryState,
  resolveWxshopEntryState,
  showWxshopUnavailable,
  markWxshopPurchasePending,
  getWxshopPendingPurchase,
  clearWxshopPendingPurchase,
  navigateToWxshopProduct,
} from './wxshop'
export type { WxshopProduct, WxshopConfig, WxshopEntryState, WxshopPendingPurchase } from './wxshop'

export { redeemCode } from './redeem'
export type { RedeemResult } from './redeem'

export {
  getClaimTokenStatus,
  claimByToken,
  getClaimSceneStatus,
  claimByScene,
} from './wechat-store'
export type { ClaimStatus, ClaimStatusValue } from './wechat-store'
