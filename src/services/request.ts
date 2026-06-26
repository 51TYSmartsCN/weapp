import Taro from '@tarojs/taro'

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
}): Promise<T> {
  try {
    const res = await Taro.request({
      ...options,
      method: options.method as any,
    })
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

/** 统一展示后端错误：前端不再自行构造错误文案 */
export function showApiError(err: unknown, fallback = '操作失败') {
  const message = err instanceof ApiException ? err.message : fallback
  Taro.showToast({ title: message, icon: 'none' })
}
