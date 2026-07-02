import Taro from '@tarojs/taro'

/**
 * 后端服务地址
 * - 开发环境: http://localhost:4000（.env.development）
 * - 生产环境: https://ty-server-api.tysmarts.cn（.env.production）
 * 通过 dotenv + Taro defineConstants 在编译时注入
 */
export const BASE_URL: string = process.env.TARO_APP_BASE_URL

/** 本地存储中保存 token 的 key（与 auth.ts 保持一致） */
const TOKEN_KEY = 'geo_token'

/** 防止 401 时多次重复跳转登录页 */
let isRedirectingToLogin = false

/**
 * 后端统一响应结构
 * {
 *   code: 0 | 200 表示成功，其他为业务错误码
 *   data: T
 *   message?: string  // 错误时由后端提供可读提示
 * }
 */
export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

/** 前端统一异常：message 必须来自后端 */
export class ApiException extends Error {
  constructor(
    public code: number,
    public message: string
  ) {
    super(message)
  }
}

/**
 * 通用请求封装
 * - 仅当 code === 0 或 200 时返回 data
 * - 否则抛出 ApiException，message 来自后端
 * - 网络/非预期异常也包装为 ApiException，message 尽量取自后端或底层错误
 */
export async function request<T>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  /** 是否跳过自动注入 token（登录接口本身不需要 token） */
  skipAuth?: boolean
  /** optional: 有 token 就带上，没有也不跳登录 */
  authMode?: 'required' | 'optional' | 'none'
}): Promise<T> {
  try {
    const header: Record<string, string> = {}
    const authMode = options.skipAuth ? 'none' : options.authMode || 'required'

    // 自动注入 Bearer token（登录接口除外）
    // 所有需要鉴权的接口，若本地无 token，直接跳转登录页，不再发送请求等待 401
    if (authMode !== 'none') {
      const token = Taro.getStorageSync(TOKEN_KEY)
      if (!token && authMode === 'required') {
        redirectToLogin()
        throw new ApiException(401, '请先登录')
      }
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }
    }

    const { url, method, data } = options
    const res = await Taro.request({
      url: BASE_URL + url,
      method: method as any,
      data,
      header,
    })

    // HTTP 401：token 失效或未登录，清除本地 token 并跳转登录页
    if (res.statusCode === 401) {
      Taro.removeStorageSync(TOKEN_KEY)
      redirectToLogin()
      throw new ApiException(401, '登录已过期，请重新登录')
    }

    const body = res.data as ApiResponse<T>

    if (body.code !== 0 && body.code !== 200) {
      throw new ApiException(body.code, body.message || '请求失败')
    }

    return body.data
  } catch (err) {
    if (err instanceof ApiException) throw err

    const message = err instanceof Error ? err.message : '网络异常，请稍后重试'
    throw new ApiException(-1, message)
  }
}

/** 跳转到登录页（带防抖，避免并发 401 触发多次跳转） */
function redirectToLogin() {
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true
  Taro.reLaunch({ url: '/pages/login/index' }).finally(() => {
    isRedirectingToLogin = false
  })
}

/** 统一展示后端错误：前端不再自行构造错误文案 */
export function showApiError(err: unknown, fallback = '操作失败') {
  const message = err instanceof ApiException ? err.message : fallback
  Taro.showToast({ title: message, icon: 'none' })
}
