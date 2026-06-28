import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { jwtConfig } from './config'
import { unauthorized } from './utils'

/** 已登出的 token 黑名单（内存实现，进程重启后清空）
 *  JWT 是无状态的，前端清本地 token 后 token 在有效期内仍可被复用；
 *  通过黑名单记录已登出的 token，让"退出登录"真正生效。 */
const tokenBlacklist = new Set<string>()

/** 将 token 加入黑名单 */
export function blacklistToken(token: string): void {
  if (!token) return
  tokenBlacklist.add(token)
  // 防止内存泄漏：超过 5000 条时清空（开发期足够用，生产应换 Redis）
  if (tokenBlacklist.size > 5000) {
    tokenBlacklist.clear()
  }
}

/** 检查 token 是否已登出 */
export function isBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token)
}

/** 签发 JWT */
export function signToken(userId: number): string {
  return jwt.sign({ userId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn as any })
}

/** 扩展 Request 类型 */
export interface AuthRequest extends Request {
  userId?: number
}

/** 认证中间件：从 Authorization: Bearer <token> 解析 userId */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res)
  }
  const token = authHeader.slice(7)
  // 黑名单校验：已登出的 token 拒绝
  if (isBlacklisted(token)) {
    return unauthorized(res, 'token 已失效，请重新登录')
  }
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as { userId: number }
    req.userId = payload.userId
    next()
  } catch {
    return unauthorized(res, 'token 无效或已过期')
  }
}

/** 可选认证中间件:有 token 则解析 userId,无 token 或 token 无效也不报错
 * 适用于「匿名也能访问,但登录后能拿到更多信息」的接口,如课程权限查询
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    // 已登出的 token 当作未登录处理
    if (!isBlacklisted(token)) {
      try {
        const payload = jwt.verify(token, jwtConfig.secret) as { userId: number }
        req.userId = payload.userId
      } catch {
        // token 无效就当未登录处理,不报错
      }
    }
  }
  next()
}
