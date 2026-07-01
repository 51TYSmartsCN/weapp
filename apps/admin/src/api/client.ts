import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

const adminLoginPath = `${import.meta.env.BASE_URL}login`
const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

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
  const res = await api(config)
  const { code, data, message } = res.data
  if (code !== 0) {
    throw new Error(message || '请求失败')
  }
  return data as T
}

export default api
