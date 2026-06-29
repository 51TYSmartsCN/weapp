import { request } from './client'
import { login, logout, getToken, isLoggedIn } from './auth'

// ===================== 类型 =====================

interface PaginationParams {
  page?: number
  size?: number
  search?: string
  status?: number
}

interface PageResult<T> {
  list: T[]
  total: number
}

interface DashboardStats {
  totalCourses: number
  totalUsers: number
  totalOrders: number
  totalInstructors: number
  totalRevenue: number
  todayOrders: number
}

// ===================== 通用工具 =====================

function listParams(p: PaginationParams): string {
  const s = new URLSearchParams()
  if (p.page) s.set('page', String(p.page))
  if (p.size) s.set('size', String(p.size))
  if (p.search) s.set('search', p.search)
  if (p.status !== undefined) s.set('status', String(p.status))
  return s.toString()
}

// ===================== Dashboard =====================

export const dashboardApi = {
  getStats() {
    return request<DashboardStats>({ url: '/admin/dashboard' })
  },
}

// ===================== Courses =====================

export const courseApi = {
  getList(params?: PaginationParams) {
    return request<PageResult<any>>({
      url: `/admin/courses?${listParams(params || {})}`,
    })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/courses', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/courses/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/courses/${id}` })
  },
  toggleStatus(id: number) {
    return request({ method: 'PUT', url: `/admin/courses/${id}/status` })
  },
  toggleHot(id: number) {
    return request({ method: 'PUT', url: `/admin/courses/${id}/hot` })
  },
  toggleAccess(id: number) {
    return request<{ requiresAccess: boolean }>({ method: 'PUT', url: `/admin/courses/${id}/access` })
  },
}

// ===================== Instructors =====================

export const instructorApi = {
  getList() {
    return request<any[]>({ url: '/admin/instructors' })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/instructors', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/instructors/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/instructors/${id}` })
  },
  /** 上传讲师头像图片，返回可访问 URL */
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ url: string }>({
      method: 'POST',
      url: '/admin/instructors/avatar',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ===================== Lessons =====================

export const lessonApi = {
  getList(courseId: number) {
    return request<any[]>({ url: `/admin/lessons?courseId=${courseId}` })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/lessons', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/lessons/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/lessons/${id}` })
  },
  reorder(items: { id: number; sort: number }[]) {
    return request({ method: 'PUT', url: '/admin/lessons/reorder', data: { items } })
  },
}

// ===================== Banners =====================

export const bannerApi = {
  getList() {
    return request<any[]>({ url: '/admin/banners' })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/banners', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/banners/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/banners/${id}` })
  },
  toggleStatus(id: number) {
    return request({ method: 'PUT', url: `/admin/banners/${id}/status` })
  },
}

// ===================== Categories =====================

export const categoryApi = {
  getList() {
    return request<any[]>({ url: '/admin/categories' })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/categories', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/categories/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/categories/${id}` })
  },
}

// ===================== Users =====================

export const userApi = {
  getList(params?: PaginationParams) {
    return request<PageResult<any>>({
      url: `/admin/users?${listParams(params || {})}`,
    })
  },
  getById(id: number) {
    return request<any>({ url: `/admin/users/${id}` })
  },
  updateVip(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/users/${id}/vip`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/users/${id}` })
  },
}

// ===================== Orders =====================

export const orderApi = {
  getList(params?: PaginationParams) {
    return request<PageResult<any>>({
      url: `/admin/orders?${listParams(params || {})}`,
    })
  },
  getById(id: number) {
    return request<any>({ url: `/admin/orders/${id}` })
  },
}

// ===================== Reviews =====================

export const reviewApi = {
  getList(params?: PaginationParams) {
    return request<PageResult<any>>({
      url: `/admin/reviews?${listParams(params || {})}`,
    })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/reviews/${id}` })
  },
}

// ===================== Feedbacks =====================

export const feedbackApi = {
  getList() {
    return request<any[]>({ url: '/admin/feedbacks' })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/feedbacks/${id}` })
  },
}

// ===================== Help Articles =====================

export const helpArticleApi = {
  getList() {
    return request<any[]>({ url: '/admin/help-articles' })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/help-articles', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/help-articles/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/help-articles/${id}` })
  },
}

// ===================== App Configs（应用配置） =====================

interface TabItem {
  text: string
  iconUrl: string
  activeIconUrl: string
}

interface ThemeConfig {
  primary: string
  primaryLight: string
  primaryLighter: string
  primaryLightest: string
  primaryDark: string
  primaryDarker: string
  tabBarSelectedColor: string
  tabBarColor: string
  tabBarBgColor: string
  /** TabBar 图标配置（4 个 tab） */
  tabItems?: TabItem[]
}

interface AppInfo {
  /** 应用名称 */
  appName: string
  /** 应用 Logo 图片 URL（相对路径） */
  appLogo?: string
  /** 应用描述/副标题 */
  appDescription?: string
}

export const appConfigApi = {
  getTheme() {
    return request<any>({ url: '/admin/app-configs/theme' })
  },
  updateTheme(data: ThemeConfig) {
    return request({ method: 'PUT', url: '/admin/app-configs/theme', data: { value: data, description: '小程序主题与 TabBar 配置' } })
  },
  /** 上传 TabBar 图标 */
  uploadTabIcon(index: number, state: 'normal' | 'active', file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ url: string }>({
      method: 'POST',
      url: `/admin/app-configs/tabbar/icon/${index}/${state}`,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** 获取应用基础信息 */
  getAppInfo() {
    return request<any>({ url: '/admin/app-configs/app-info' })
  },
  /** 更新应用基础信息 */
  updateAppInfo(data: AppInfo) {
    return request({
      method: 'PUT',
      url: '/admin/app-configs/app-info',
      data: { value: data, description: '应用基础信息（名称、描述、Logo）' },
    })
  },
  /** 上传应用 Logo */
  uploadLogo(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ url: string }>({
      method: 'POST',
      url: '/admin/app-configs/logo',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** 获取模块展示模式配置 */
  getModuleModes() {
    return request<any>({ url: '/admin/app-configs/module-modes' })
  },
  /** 更新模块展示模式配置 */
  updateModuleModes(data: Record<string, any>) {
    return request({
      method: 'PUT',
      url: '/admin/app-configs/module-modes',
      data: { value: data, description: '模块展示模式配置（lessonPlayer.contentMode / courseDetailCover.mode）' },
    })
  },
}

// ===================== Wxshop Products（微信小店商品-课程映射） =====================

export const wxshopProductApi = {
  getList(params?: PaginationParams) {
    return request<PageResult<any>>({
      url: `/admin/wxshop-products?${listParams(params || {})}`,
    })
  },
  create(data: Record<string, any>) {
    return request({ method: 'POST', url: '/admin/wxshop-products', data })
  },
  update(id: number, data: Record<string, any>) {
    return request({ method: 'PUT', url: `/admin/wxshop-products/${id}`, data })
  },
  remove(id: number) {
    return request({ method: 'DELETE', url: `/admin/wxshop-products/${id}` })
  },
  toggleStatus(id: number, status: boolean) {
    return request({ method: 'PUT', url: `/admin/wxshop-products/${id}/status`, data: { status } })
  },
}

// ===================== Re-export =====================

export { login, logout, getToken, isLoggedIn }
