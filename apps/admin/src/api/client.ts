import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

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
      window.location.href = '/login'
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
