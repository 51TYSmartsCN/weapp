import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { jwtConfig } from './config'
import { unauthorized } from './utils'

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
  try {
    const payload = jwt.verify(token, jwtConfig.secret) as { userId: number }
    req.userId = payload.userId
    next()
  } catch {
    return unauthorized(res, 'token 无效或已过期')
  }
}
