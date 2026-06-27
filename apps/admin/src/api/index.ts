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

// ===================== Re-export =====================

export { login, logout, getToken, isLoggedIn }
