import { Response } from 'express'

/** 成功响应：{ code: 0, data } */
export function ok<T>(res: Response, data: T) {
  return res.json({ code: 0, data })
}

/** 失败响应：{ code, message }，HTTP 200 */
export function fail(res: Response, code: number, message: string) {
  return res.json({ code, message })
}

/** 未认证：HTTP 401 */
export function unauthorized(res: Response, message = '未登录') {
  return res.status(401).json({ code: 401, message })
}
