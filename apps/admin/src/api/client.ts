import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

const adminLoginPath = `${import.meta.env.BASE_URL}login`
const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

export class ApiRequestError extends Error {
  status?: number
  responseText?: string

  constructor(message: string, options?: { status?: number; responseText?: string }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options?.status
    this.responseText = options?.responseText
  }
}

export function resolveApiBaseUrl(rawBaseUrl?: string): string {
  const normalizedBaseUrl = (rawBaseUrl || '').trim().replace(/\/+$/, '')
  if (!normalizedBaseUrl) {
    return '/api'
  }

  if (normalizedBaseUrl.endsWith('/api')) {
    return normalizedBaseUrl
  }

  return `${normalizedBaseUrl}/api`
}

// 请求拦截器：附加 token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：401 清除 token 跳转登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = adminLoginPath
    }
    return Promise.reject(error)
  },
)

/** 通用请求函数，自动解包 { code: 0, data } 格式 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api(config)
    const { code, data, message } = res.data
    if (code !== 0) {
      throw new ApiRequestError(message || '请求失败')
    }
    return data as T
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      const responseData = axiosError.response?.data
      const responseText =
        typeof responseData === 'string'
          ? responseData
          : responseData && typeof responseData === 'object' && 'message' in responseData
            ? String((responseData as { message?: unknown }).message || '')
            : ''
      const message =
        responseText ||
        axiosError.message ||
        '请求失败'
      throw new ApiRequestError(message, {
        status: axiosError.response?.status,
        responseText,
      })
    }
    if (error instanceof Error) {
      throw error
    }
    throw new ApiRequestError('请求失败')
  }
}

export default api
